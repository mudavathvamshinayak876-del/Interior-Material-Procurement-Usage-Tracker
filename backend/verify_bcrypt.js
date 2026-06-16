const bcrypt = require('bcryptjs');
const hash = '$2a$10$wKlh2ZtU71j.uQdC791D6.dZ9a1Jp0RjE6w78aLh835rT4D31a69G';

bcrypt.compare('password123', hash).then(res => {
  console.log('Does password123 match hash?', res);
}).catch(err => {
  console.error('Bcrypt error:', err);
});
