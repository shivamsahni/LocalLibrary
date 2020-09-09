var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema({
    book:{type: Schema.Types.ObjectId, ref: 'Book', required: true},
    imprint:{type: String, required: true},
    status:{type: String, required: true, enum:['Available', 'Maintenance', 'Loaned', 'Reserved'], default:'Maintenance'},
    due_back:{type: Date, default: Date.now}
})

// virtual BookInstance's URL
BookInstanceSchema.virtual('url').get(function(){
    return '/catalog/bookinstance/' + this._id;
})

// virtual BookInstance's due date formatted using moment
BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
  return this.due_back?moment(this.due_back).format('MMMM DD, YYYY'):'';
});

// Export Model
module.exports = mongoose.model('BookInstance', BookInstanceSchema)


