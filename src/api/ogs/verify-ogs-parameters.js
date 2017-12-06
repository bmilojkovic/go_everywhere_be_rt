module.exports = (request) => (
  request.server === "ogs" &&
  request.lobby === "ogs" &&
  request.room === "ogs"
);
