var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { nextTick } = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const book = require('../models/book');
var async = require('async');

// Display list of all Book Instance
exports.bookinstance_list = function(req, res, next){
    BookInstance.find().populate('book').exec(function(err, list_bookinstances){
        if(err) return next(err);
        res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
    });
}

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next){

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, results){
        if(err) return next(err);
        if (results==null) { // No results.
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
          }        
        res.render('bookinstance_detail', {title: ('ID: '+req.params.id), bookinstance_detail: results});
    })
}

// Display bookinstance create form on get
exports.bookinstance_create_get = function(req, res, next){
    Book.find().exec(function(err, allBooks){
        if(err){return next(err);}
        res.render('bookinstance_form', {title:'Create Bookinstance', books:allBooks});
    })
}

// Handle bookinstance create on post
exports.bookinstance_create_post = [

    // validate body
    body('book', 'Book is required').trim().isLength({min:1}),
    body('imprint', 'Imprint is required').trim().isLength({min:1}),
    body('status', 'Status is required').trim().isLength({min:1}),
    body('due_back', 'Not a valid date').optional({checkFalsy:true}).isISO8601(),

    // sanitize body
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    function(req, res, next){

        // check for validation errors
        let errors = validationResult(req);

        let bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        // sending response back on the page with the data filled by client with error messages
        if(!errors.isEmpty())
        {
            Book.find({},function(err, allBooks){
                if(err){return next(err);}
                res.render('bookinstance_form', {title: 'Create BookInstance', books:allBooks, bookinstance: bookinstance, errors: errors.array()});  
            })
        }
        else{

            // No error, lets check if this bookinstance already present with us

            BookInstance.findOne({book: bookinstance.book, imprint: bookinstance.imprint}).exec(function(err, isBookInstance){
                if(isBookInstance)
                {
                    // bookinstance already present
                    res.redirect(isBookInstance.url);
                }
                else{
                    bookinstance.save(function(err){
                        if(err){return next(err);}
                        res.redirect(bookinstance.url);
                    })
                }
            })
        }
    }

]

// Display bookinstance delete form on get
exports.bookinstance_delete_get = function(req, res, next){
    res.render('bookinstance_delete', {title: 'Delete BookInstance', bookinstance_id: req.params.id});
}

// Handle bookinstance delete on POST
exports.bookinstance_delete_post = function(req, res, next){

    // simply delete book
    console.log('book instance to be deleted: '+req.body.bookinstanceid);

    BookInstance.findByIdAndDelete(req.body.bookinstanceid, function(err){
        if(err){return next(err);}
        // redirect to all bookinstance page
        res.redirect('/catalog/bookinstances');
    })

}

// Display bookinstance update form on get
exports.bookinstance_update_get = function(req, res, next){
    async.parallel({
        books: function(callback){Book.find(callback)},
        bookinstance: function(callback){BookInstance.findById(req.params.id,callback)}
    }, function(err, results){
        if(err){return next(err);}
        res.render('bookinstance_form', {title: 'Update BookInstance', books:results.books, bookinstance:results.bookinstance})
    })
}

// Handle bookinstance update on post
exports.bookinstance_update_post = [
    // validate body
    body('book', 'Book is required').trim().isLength({min:1}),
    body('imprint', 'Imprint is required').trim().isLength({min:1}),
    body('status', 'Status is required').trim().isLength({min:1}),
    body('due_back', 'Not a valid date').optional({checkFalsy:true}).isISO8601(),

    // sanitize body
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    function(req, res, next){

        // check for validation errors
        let errors = validationResult(req);
        console.log('inside my code...')

        let bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        // sending response back on the page with the data filled by client with error messages
        if(!errors.isEmpty())
        {
            Book.find({},function(err, allBooks){
                if(err){return next(err);}
                res.render('bookinstance_form', {title: 'Update BookInstance', books:allBooks, bookinstance: bookinstance, errors: errors.array()});  
            })
            console.log('inside errors...')
        }
        else{
            BookInstance.findByIdAndUpdate(bookinstance._id, bookinstance, {}, function(err, bookinst){
                if(err){return next(err);}
                if(bookinst==null)
                {
                    var er = new Error('BookInstance not found');
                    er.message = 404;
                    return next(er);
                }                
                res.redirect(bookinst.url);
            })
        }
    }
]


