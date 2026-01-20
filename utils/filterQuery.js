const regexQueryFields = require("./regexQuery");

const filterQueryFields = (queryObj) => {
  const notAllowedFields = ['sort', 'page', 'limit', 'skip'];

  const allQueryObj = Object.entries(queryObj);
  const filteredQueryObj = {};

  allQueryObj.forEach(curField => {
    if (!notAllowedFields.includes(curField[0]))
      filteredQueryObj[curField[0]] = curField[1].toLowerCase();
  })

  return regexQueryFields(filteredQueryObj);
};

module.exports = filterQueryFields;