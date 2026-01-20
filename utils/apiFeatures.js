const filterQueryFields = require("./filterQuery");

class APIFeatures{
  constructor(query,queryStr,userId) {
    this.query = query;
    this.queryStr = queryStr;
    this.userId = userId;
  }
  filter() {
    const filter = filterQueryFields(this.queryStr);
    this.query = this.query.find({...filter,user:this.userId});

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      let sortFields = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortFields);      
    }
    return this;
  }

  select() {
    if (this.queryStr.select) {
      const selectedFields = this.queryStr.select.split(',').join(' ');
      this.query = this.query.select(selectedFields);
    }
    return this;
  }

  paginate() {
    if (this.queryStr.page || this.queryStr.limit) {
      const page = this.queryStr.page || 1;
      const limit = this.queryStr.limit || 5;
      this.query = this.query.skip((page - 1) * limit).limit(limit);
    }
    return this;
  }
}

module.exports = APIFeatures;