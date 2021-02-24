import eaxios, { EaxiosError } from '../src/index.js';

interface Response {
  id: number;
}

eaxios<Response>('/xxx')
  .then((data) => {
    console.log(data.id);
  })
  .catch((error: EaxiosError) => {
    // TODO
  });
