function extractErrors(errors) {
  const ret = [];
  if (errors.response && errors.response.data) {
    ret.push(errors.response.data.message);
  } else if (ret.length === 0 && errors.message) {
    ret.push({ code: 500, message: 'CONNECTION_FAILED' });
  } else {
    ret.push({ code: -1, message: 'SOMETHING_WRONG' });
    console.log('err :>> GENERAL_ERROR');
  }
  return ret;
}

export default extractErrors;
