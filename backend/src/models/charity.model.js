const sql = require('../config/db');

exports.getAllCharities = async () => {
  return await sql`SELECT * FROM charities`;
};

exports.createCharity = async (charity) => {
  const { name, description, category } = charity;
  const result = await sql`
    INSERT INTO charities (name, description, category) 
    VALUES (${name}, ${description}, ${category}) 
    RETURNING id`;
  return result[0]?.id;
};

exports.updateCharity = async (id, charity) => {
  const { name, description, category } = charity;
  await sql`
    UPDATE charities 
    SET name = ${name}, description = ${description}, category = ${category} 
    WHERE id = ${id}`;
  return 1;
};

exports.deleteCharity = async (id) => {
  await sql`DELETE FROM charities WHERE id = ${id}`;
  return 1;
};