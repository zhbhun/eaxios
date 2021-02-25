import eaxios, { EaxiosError } from '../';

interface Response {
  id: number;
}
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

function printError(error: EaxiosError) {
  return `code: ${error.code}, name: ${error.name}, message: ${error.message}, isAxiosError: ${error['isAxiosError']}, stack:\n${error.stack}`;
}

function success() {
  console.log('>> success');
  return eaxios<Response>(
    'https://run.mocky.io/v3/4f503449-0349-467e-a38a-c804956712b7',
  )
    .then((data) => {
      console.log('success', data.id);
    })
    .catch((error: EaxiosError) => {
      printError(error);
    });
}

