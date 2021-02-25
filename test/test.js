const eaxios = require('..');

eaxios.defaults.transformResponse = [
  function (data, response) {
    if (typeof data === 'object') {
      if (data.code === 0) {
        return data.data;
      } else {
        throw eaxios.createError(data.message, data.code, response);
      }
    } else {
      throw eaxios.createError(
        data,
        response.config.responseError.SERVER_ERROR,
        response,
      );
    }
  },
];

function printError(error) {
  console.log(
    `code: ${error.code}, name: ${error.name}, message: ${error.message}, isAxiosError: ${error.isAxiosError}, stack:\n${error.stack}`,
  );
}

function success() {
  console.log('>> success');
  return eaxios('https://run.mocky.io/v3/4f503449-0349-467e-a38a-c804956712b7')
    .then((data) => {
      console.log('success', data);
    })
    .catch((error) => {
      printError(error);
    });
}

function failure() {
  console.log('>> failure');
  return eaxios('https://run.mocky.io/v3/42d7c21d-5ae6-4b52-9c2d-4c3dd221eba4')
    .then((data) => {
      console.log('success', data);
    })
    .catch((error) => {
      printError(error);
    });
}

function invalid() {
  console.log('>> invalid');
  return eaxios('https://run.mocky.io/v3/1b23549f-c918-4362-9ac8-35bc275c09f0')
    .then((data) => {
      console.log('success', data);
    })
    .catch((error) => {
      printError(error);
    });
}

function server_500() {
  console.log('>> server_500');
  return eaxios('https://run.mocky.io/v3/2a9d8c00-9688-4d36-b2de-2dee5e81f5b3')
    .then((data) => {
      console.log('success', data);
    })
    .catch((error) => {
      printError(error);
    });
}

success().then(failure).then(invalid).then(server_500);
