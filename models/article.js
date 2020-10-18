const mongoose = require('mongoose');
const slugify = require('slugify');
const marked = require('marked');
const createDomPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurifier(new JSDOM().window);

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    markdown: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    sanitizedHtml: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        default: "Karthikeya Udupa",
        required: true
    },
    authorImageUrl: {
        type: String,
        required: true
    },
    published: {
        type: String,
        default: "on",
        required: true
    },
    metadataKeywords: {
        type: String,
        default: "Skillcurves, Karthikeya Udupa, ",
    }
});

articleSchema.pre('validate', function(next){
    if (this.title) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true
        })
    }

    if (this.markdown) {
        this.sanitizedHtml = dompurify.sanitize(marked(this.markdown));
    }

    next()
})

module.exports = mongoose.model('Article', articleSchema);