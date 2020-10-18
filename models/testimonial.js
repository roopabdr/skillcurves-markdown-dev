const mongoose = require('mongoose');
const slugify = require('slugify');

const testimonialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    testimonial: {
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
    authorName: {
        type: String
    },
    authorImageUrl: {
        type: String
    },
    published: {
        type: String,
        default: "on",
        required: true
    },
    metadataKeywords: {
        type: String,
        default: "Skillcurves, Karthikeya Udupa, Testimonials, ",
    }    
});

testimonialSchema.pre('validate', function(next){
    if (this.title) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true
        })
    }

    next()
})

module.exports = mongoose.model('Testimonial', testimonialSchema);