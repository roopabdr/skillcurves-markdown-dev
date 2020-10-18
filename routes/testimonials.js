const express = require('express');
const Testimonial = require('../models/testimonial');
const router = express.Router();

router.get('/new', (req,res) => {
    res.render('testimonials/testimonial_new', { testimonial: new Testimonial() })
});

router.get('/edit/:id', async (req,res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    res.render('testimonials/testimonial_edit', { testimonial: testimonial })
});

router.get('/:slug', async (req, res) => {
    const testimonial = await Testimonial.findOne({slug :req.params.slug});
    if (testimonial == null) {
        res.redirect('/');
    }
    res.render('testimonials/testimonial_show', { testimonial: testimonial });
});

router.post('/', async (req,res, next)=>{
    req.testimonial = new Testimonial();
    next()
}, saveTestimonialAndRedirect('new'));

router.put('/:id', async (req, res, next) => {
    req.testimonial = await Testimonial.findById(req.params.id);
    next()
}, saveTestimonialAndRedirect('edit'));

router.delete('/:id', async (req, res) => {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.redirect('/testimonials');
});

function saveTestimonialAndRedirect(path) {
    return async (req, res) => {
        let testimonial = req.testimonial;
        
        testimonial.title= req.body.title;
        testimonial.testimonial = req.body.testimonial;
        testimonial.authorName = req.body.authorName
        testimonial.authorImageUrl = req.body.authorImageUrl        
        testimonial.published = req.body.published !== "on"? "no": req.body.published
        testimonial.metadataKeywords = req.body.metadataKeywords

        try {
            testimonial = await testimonial.save()
            res.redirect(`/testimonials/${testimonial.slug}`)
        } catch (e) {
            res.render(`testimonials/${path}`, {testimonial: testimonial});
        }
    }
}

module.exports = router;