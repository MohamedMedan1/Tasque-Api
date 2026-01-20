const filterBodyFields = (reqBody) => {
  const allowedFields = ['name', 'email'];
  const currentFields = Object.keys(reqBody);//['name','email','password']
  const filteredBody = {}; // ['name','email']

  currentFields.forEach(curField => {
    if (allowedFields.includes(curField)) {
      filteredBody[curField] = reqBody[curField];
    }
  });

  return filteredBody;
  
}

module.exports = filterBodyFields;