const { attachPaginate } = require("knex-paginate"); //Un sistema propio de knex para paginaciones
attachPaginate();

require("dotenv").config();

const dev = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};

module.exports = dev;
