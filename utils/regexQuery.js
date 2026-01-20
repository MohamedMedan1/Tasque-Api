
const regexQueryFields = (filteredQueryObj) => {
  const completedFilteredObj = {};
  const neededFields = ['title', 'description'];
  
  const fieldValueArr = Object.entries(filteredQueryObj);

  fieldValueArr.forEach(curField => {
    if (neededFields.includes(curField[0])) {
      completedFilteredObj[curField[0]] = { $regex: `${curField[1]}`, $options: 'i' };
    }
    else completedFilteredObj[curField[0]] = curField[1];
  })
  
  return completedFilteredObj;
}


module.exports = regexQueryFields;