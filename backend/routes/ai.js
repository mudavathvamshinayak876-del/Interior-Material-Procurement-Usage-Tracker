const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/ai/insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch data for analysis
    const projects = await db.query('SELECT * FROM projects WHERE status IN (\'active\', \'planning\')');
    const materials = await db.query(`
      SELECT m.*, p.project_name, p.budget, s.supplier_name, s.contact_person
      FROM materials m
      JOIN projects p ON m.project_id = p.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
    `);

    const anomalies = [];
    const reorderSuggestions = [];
    const forecasts = [];
    const summaries = [];
    const costSavingActions = [];

    // Analyze material data
    const projectGroups = {};
    materials.rows.forEach(m => {
      if (!projectGroups[m.project_id]) {
        projectGroups[m.project_id] = {
          name: m.project_name,
          budget: parseFloat(m.budget) || 0,
          materials: [],
          totalCost: 0,
          totalWastedCost: 0,
          totalReceived: 0,
          totalWasted: 0
        };
      }
      projectGroups[m.project_id].materials.push(m);
      
      const received = parseFloat(m.received_qty) || 0;
      const used = parseFloat(m.used_qty) || 0;
      const wasted = parseFloat(m.wasted_qty) || 0;
      const remaining = parseFloat(m.remaining_qty) || 0;
      const cost = parseFloat(m.unit_cost) || 0;
      const ordered = parseFloat(m.ordered_qty) || 0;

      projectGroups[m.project_id].totalCost += received * cost;
      projectGroups[m.project_id].totalWastedCost += wasted * cost;
      projectGroups[m.project_id].totalReceived += received;
      projectGroups[m.project_id].totalWasted += wasted;

      // Detect Abnormal Wastage (>10%)
      if (received > 0) {
        const wastageRate = wasted / received;
        if (wastageRate > 0.10) {
          anomalies.push({
            id: m.id,
            project_name: m.project_name,
            material_name: m.material_name,
            wastage_percentage: (wastageRate * 100).toFixed(1),
            wasted_qty: wasted,
            cost_impact: (wasted * cost).toFixed(2),
            severity: wastageRate > 0.15 ? 'critical' : 'warning',
            message: `Project '${m.project_name}' has ${m.material_name} wastage of ${(wastageRate * 100).toFixed(1)}% which exceeds the safety threshold of 10.0%.`
          });
        }
      }

      // Suggest Reorder Quantity
      // Trigger: status is received or partially_received AND remaining quantity is low (<= 15% of ordered quantity or <= 5 units)
      const isLowStock = received > 0 && (remaining <= 5 || remaining <= (ordered * 0.15));
      if (isLowStock && m.status !== 'ordered') {
        const safetyBuffer = Math.ceil(ordered * 0.20); // Suggest 20% of original order as safety buffer
        reorderSuggestions.push({
          id: m.id,
          project_id: m.project_id,
          project_name: m.project_name,
          material_name: m.material_name,
          current_remaining: remaining,
          suggested_qty: safetyBuffer,
          unit_cost: cost,
          estimated_cost: (safetyBuffer * cost).toFixed(2),
          supplier_name: m.supplier_name || 'Unassigned',
          message: `Recommended reorder quantity for '${m.material_name}' in '${m.project_name}': ${safetyBuffer} units to prevent site delay. Est. cost: ₹${(safetyBuffer * cost).toLocaleString('en-IN')}`
        });
      }

      // Material Requirements Forecast
      // Simple forecasting logic: If used quantity is high (> 80%) but project is active, forecast future shortages
      if (received > 0 && used > 0 && (used / received) > 0.75 && remaining <= 10) {
        const estimatedDeficit = Math.ceil(ordered * 0.3); // Estimate 30% additional required
        forecasts.push({
          project_name: m.project_name,
          material_name: m.material_name,
          usage_rate: ((used / received) * 100).toFixed(1),
          message: `High usage rate (${((used / received) * 100).toFixed(0)}%) detected for '${m.material_name}'. Based on progress velocity, we forecast a deficit of ${estimatedDeficit} units before project completion.`
        });
      }
    });

    // 2. Generate Project Summaries
    Object.keys(projectGroups).forEach(projId => {
      const g = projectGroups[projId];
      const avgWastage = g.totalReceived > 0 ? ((g.totalWasted / g.totalReceived) * 100).toFixed(1) : '0.0';
      const budgetUtilization = g.budget > 0 ? ((g.totalCost / g.budget) * 100).toFixed(1) : '0.0';
      
      summaries.push({
        project_name: g.name,
        total_materials_tracked: g.materials.length,
        total_cost_spent: g.totalCost.toFixed(2),
        total_wastage_cost: g.totalWastedCost.toFixed(2),
        average_wastage_rate: `${avgWastage}%`,
        budget_utilization: `${budgetUtilization}%`,
        summary_text: `Project '${g.name}' has tracked ${g.materials.length} material lines, with a total spend of ₹${g.totalCost.toLocaleString('en-IN')}. The budget utilization is at ${budgetUtilization}%, with an average wastage rate of ${avgWastage}%.`
      });
    });

    // 3. Recommend Cost Saving Actions
    // Action A: Switch suppliers with high wastage rates
    const supplierStats = {};
    materials.rows.forEach(m => {
      if (m.supplier_id && m.received_qty > 0) {
        if (!supplierStats[m.supplier_id]) {
          supplierStats[m.supplier_id] = {
            name: m.supplier_name,
            contact: m.contact_person,
            totalReceived: 0,
            totalWasted: 0
          };
        }
        supplierStats[m.supplier_id].totalReceived += parseFloat(m.received_qty) || 0;
        supplierStats[m.supplier_id].totalWasted += parseFloat(m.wasted_qty) || 0;
      }
    });

    Object.keys(supplierStats).forEach(supId => {
      const s = supplierStats[supId];
      const wastageRate = s.totalWasted / s.totalReceived;
      if (wastageRate > 0.12) {
        costSavingActions.push({
          type: 'supplier_wastage',
          title: `High Material Defect Rate: ${s.name}`,
          recommendation: `Audit material quality from '${s.name}' (contact: ${s.contact}). Materials supplied show a cumulative wastage of ${(wastageRate * 100).toFixed(1)}%. Consider switching to alternative suppliers if defects continue.`,
          savings_potential: 'Medium'
        });
      }
    });

    // Action B: Bulk order discount suggestion
    const categoryTotals = {};
    materials.rows.forEach(m => {
      const ordered = parseFloat(m.ordered_qty) || 0;
      const cost = parseFloat(m.unit_cost) || 0;
      if (!categoryTotals[m.category]) {
        categoryTotals[m.category] = { qty: 0, cost: 0 };
      }
      categoryTotals[m.category].qty += ordered;
      categoryTotals[m.category].cost += ordered * cost;
    });

    Object.keys(categoryTotals).forEach(cat => {
      const total = categoryTotals[cat];
      if (total.cost > 200000) {
        costSavingActions.push({
          type: 'bulk_negotiation',
          title: `Bulk Procurement Opportunity: ${cat}`,
          recommendation: `Total procurement for '${cat}' has reached ₹${total.cost.toLocaleString('en-IN')}. Negotiate a bulk contract rate (e.g., 5-8% discount) with suppliers for the next quarter.`,
          savings_potential: `₹${(total.cost * 0.07).toFixed(0)} (Est. 7% savings)`
        });
      }
    });

    // Fallback if no projects are created yet
    if (summaries.length === 0) {
      summaries.push({
        summary_text: 'No active projects detected. Create projects and add material logs to see AI summaries.'
      });
    }

    res.json({
      anomalies,
      reorderSuggestions,
      forecasts,
      summaries,
      costSavingActions
    });
  } catch (err) {
    console.error('Fetch AI insights error:', err);
    res.status(500).json({ message: 'Failed to generate AI insights.' });
  }
});

module.exports = router;
