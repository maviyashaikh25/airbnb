const Listing = require("../models/listing.js");

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClieent = mbxGeocoding({ accessToken: mapToken });
module.exports.index=async (req, res, next) => {
    const { category } = req.query;
    let query = {};
    
    if (category && category !== 'all') {
        query.category = category;
    }
    
    const allListing = await Listing.find(query);
    res.render("listings/index", { allListing, selectedCategory: category || 'all' })
    ;
}
module.exports.renderNewForm=(req, res) => {
    res.render("listings/new");
};
module.exports.showListing=async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: 'reviews', populate: { path: 'author' } })
        .populate('owner');
    if(!listing)
{
    req.flash("error","Listing was not there");
    return res.redirect("/listings");}   
    // If legacy listings are missing geometry, backfill it from Mapbox geocoding
    try {
        const needsGeometry = !listing.geometry || !Array.isArray(listing.geometry.coordinates) || listing.geometry.coordinates.length !== 2;
        if (needsGeometry && listing.location && mapToken) {
            const resp = await geocodingClieent.forwardGeocode({ query: listing.location, limit: 1 }).send();
            const feature = resp && resp.body && resp.body.features && resp.body.features[0];
            if (feature && feature.geometry) {
                listing.geometry = feature.geometry;
                await listing.save();
                // console.log('Backfilled geometry for listing', listing._id, listing.geometry);
            } else {
                // console.warn('No geocoding result to backfill geometry for listing', listing._id);
            }
        }
    } catch (err) {
        console.warn('Failed to backfill geometry:', err?.message || err);
    }
    res.render("listings/show", { listing });
}
module.exports.createListing=async (req, res, next) => {  

    let response=await geocodingClieent.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
    .send();
    
    // console.log(response.body.features[0].geometry);
      // Safely transform Multer file into the expected image object shape
    if (req.file && req.file.path) {
        req.body.listing.image = {
            url: req.file.path,
            filename: req.file.filename || "cloudinary-upload",
        };
    } else {
        req.body.listing.image = {
            url: "https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=400",
            filename: "default-listing",
        };
    }
        const newListing = new Listing(req.body.listing);
        newListing.owner=req.user._id;
        
        // Ensure category is set (fallback to 'Trending' if not provided)
        if (!newListing.category || newListing.category === '') {
            newListing.category = 'Trending';
        }
        
        // Ensure geometry is set BEFORE save (pre-save will also enforce this)
        if (!newListing.geometry || !newListing.geometry.type) {
            newListing.geometry = {
                type: "Point",
                coordinates: [72.8777, 19.0760]
            };
        }        
        await newListing.save(); 
        req.flash("success","New listing created");
        res.redirect("/listings");
    
};
module.exports.editListing=async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });
};
module.exports.updateListing=async (req, res, next) => {
    let { id } = req.params;
    // Safely transform Multer file if image is being updated
    if (req.file && req.file.path) {
        req.body.listing.image = {
            url: req.file.path,
            filename: req.file.filename || "",
        };
    }
    // If no new file, keep existing image (don't overwrite with undefined)
    
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success","listing edited successfully");
    res.redirect(`/listings/${id}`);
}
module.exports.deleteListing=async (req, res, next) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","listing deleted successfully");
    res.redirect("/listings");
};
module.exports.searchListings = async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        
        // If empty query, redirect (only one response)
        if (!q) {
            return res.redirect("/listings");
        }

        // Enum of allowed categories (must match model)
        const categories = ['Mountain','Trending','Beach','Island','Countryside','City','Camping','Snow','Desert','Lake','Villa'];
        const matchesCategory = categories.some(c => c.toLowerCase() === q.toLowerCase());

        let query = {};
        if (matchesCategory) {
            // exact category match (case-insensitive)
            query.category = new RegExp(`^${q}$`, 'i');
        } else {
            // search location/title/country for the query
            const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [
                { location: regex },
                { title: regex },
                { country: regex }
            ];
        }

        const allListing = await Listing.find(query);
        
        // Only render once (no redirect after this)
        res.render("listings/index", { 
            allListing, 
            selectedCategory: matchesCategory ? q : 'all', 
            q 
        });
        
    } catch (err) {
        console.error('[search-error]', err);
        next(err);
    }
};
