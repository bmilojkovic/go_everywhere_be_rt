const isOgsRequest = (request) => (
  request.server === "ogs" &&
  request.lobby === "ogs" &&
  request.room === "ogs"
);

module.exports = isOgsRequest;
