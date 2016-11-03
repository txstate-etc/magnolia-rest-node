function ResponseError(message, res) {
  this.message = `Request to ${res.url} returned status code ${res.status}: ${message}`;
  this.name = 'ResponseError';
  this.status = res.status;
  Error.captureStackTrace(this, ResponseError);
}

ResponseError.prototype = Object.create(Error.prototype);
ResponseError.prototype.constructor = ResponseError;

exports.ResponseError = ResponseError;

exports.checkResponse = function(res) {
  if (!res.ok) {
    return res.text().then(text => {
      throw new ResponseError(text, res);
    });
  }
  return res;
};
