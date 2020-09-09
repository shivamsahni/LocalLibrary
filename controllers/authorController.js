var Author = require('../models/author');
var async = require('async');
const Book = require('../models/book');
let validator = require('express-validator');
const { validationResult } = require('express-validator');
var moment = require('moment');

// Display all list of authors
exports.author_list = function(req, res){

    Author.find({}, function(err, authors){
        if(err) return next(err);
        res.render('author_list', {title: 'List of All Authors', author_list: authors});
    })
}

// Display details page for a specific author
exports.author_detail = function(req, res){
    // res.send('NOT IMPLEMENTED: author detail page for author : '+req.params.id);
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback);
        },
        book: function(callback){
            Book.find({'author':req.params.id}).populate('author').exec(callback);
        }
    }, function(err, results){
        if(err){ return next(err);}
        if(results.book==null)
        {
            var eror = new Error('No Book Written');
            eror.message = 404;
            return next(eror);
        }

        res.render('author_detail', {title: results.author.name, author: results.author, book: results.book});
    })
}

// Display author create form on get
exports.author_create_get = function(req, res){
    res.render('author_form', {title: 'Create Author'});
}

// Handle author create on post
exports.author_create_post = [
    
    // validate inputs
    validator.body('first_name')
    .trim().isLength({min:1}).withMessage('First Name must be specified')
    .isAlphanumeric().withMessage('First Name should only contain AlphaNumeric values, no space or special characters allowed'),
    
    validator.body('family_name')
    .trim().isLength({min:1}).withMessage('Family Name must be specified')
    .isAlphanumeric().withMessage('Family Name should only contain AlphaNumeric values, no space or special characters allowed'),

    validator.body('date_of_birth')
    .optional({checkFalsy:true}).isISO8601().withMessage('Date of Birth should be a valid date'),

    validator.body('date_of_death')
    .optional({checkFalsy:true}).isISO8601().withMessage('Date of Death should be a valid date'),

    // sanitize inputs
    validator.sanitizeBody('first_name').escape(),
    validator.sanitizeBody('family_name').escape(),
    validator.sanitizeBody('date_of_birth').toDate(),
    validator.sanitizeBody('date_of_death').toDate(),

    // Process request 
    function(req, res){

        // Extract validation errors from request
        const errors = validator.validationResult(req);
        console.log('before date of birth: '+req.body.date_of_birth);
        console.log('before date of death: '+req.body.date_of_death);

        //create object
        var author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        });

        if(!errors.isEmpty())
        {
            res.render('author_form', {title:'Create Author', author:author, errors: errors.array()})
        }
        else{
            //check if this author is already present
            Author.findOne({first_name:author.first_name, family_name:author.family_name},
                function(err, results){
                    if(err){
                     return next(err);
                    }

                    if(results)
                    {
                        // This author is already present 
                        console.log('author already present')
                        res.redirect(results.url);
                    }
                    else{
                        // create a new author
                        author.save(function(err){
                            if (err) { return next(err); }
                            // redirect to author details page
                            console.log('author created successfully')
                            res.redirect(author.url);
                        })
                    }
                }
            ); 
        }
}]

// Display author delete get form
exports.author_delete_get = function(req, res){

    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback);
        },
        author_books: function(callback){
            Book.find({author:req.params.id}).exec(callback);
        }
    },function(err, results){
        if(err){return next(err);}

        if(results.author==null)
            res.redirect('/catalog/authors');

        res.render('author_delete', {title:'Delete Author', author: results.author, author_books: results.author_books});
    })
}

// Handle author delete on post
exports.author_delete_post = function(req, res){
    async.parallel({
        author: function(callback){
            Author.findById(req.body.id).exec(callback);
        },
        author_books: function(callback){
            Book.find({author:req.params.id}).exec(callback);
        }
    },function(err, results){
        if(err){return next(err);}

        if(results.author_books>0)
            res.render('author_delete', {title:'Delete Author', author: results.author, author_books: results.author_books});
        else
        {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndDelete(req.body.authorid , function(err){
                if(err){return next(err);}
                // delete successful
                res.redirect('/catalog/authors')
            })
        }
    })    
}

// Display author update get form
exports.author_update_get = function(req, res, next){
    Author.findById(req.params.id).exec(function(err, author){
        if(err){return next(err);}
        if(author==null)
        {
            var er = new Error('Author not found');
            er.message = 404;
            return next(er);
        }
        res.render('author_form', {title: 'Update Author', author: author});
    })
}

// Handle author update on post
exports.author_update_post = [
    
    // validate inputs
    validator.body('first_name')
    .trim().isLength({min:1}).withMessage('First Name must be specified')
    .isAlphanumeric().withMessage('First Name should only contain AlphaNumberic values'),
    
    validator.body('family_name')
    .trim().isLength({min:1}).withMessage('Family Name must be specified')
    .isAlphanumeric().withMessage('Family Name should only contain AlphaNumeric values'),

    validator.body('date_of_birth')
    .optional({checkFalsy:true}).isISO8601().withMessage('Date of Birth should be a valid date'),

    validator.body('date_of_death')
    .optional({checkFalsy:true}).isISO8601().withMessage('Date of Death should be a valid date'),

    // sanitize inputs
    validator.sanitizeBody('first_name').escape(),
    validator.sanitizeBody('family_name').escape(),
    validator.sanitizeBody('date_of_birth').toDate(),
    validator.sanitizeBody('date_of_death').toDate(),
    
    // process update data
    function(req, res, next){

        var er = validationResult(req);

        var author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id : req.params.id
        })

        if(!er.isEmpty())
        {
            Author.findById(req.params.id).exec(function(err, author){
                if(err){return next(err);}
                if(author==null)
                {
                    var er = new Error('Author not found');
                    er.message = 404;
                    return next(er);
                }
                res.render('author-form', {title: 'Update Author', author: author, errors:er.array()});
            })
        }
        else{
            //data is valid, go for update
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, author){
                if(err){return next(err);}
                res.redirect(author.url);
            })
        }
}]
