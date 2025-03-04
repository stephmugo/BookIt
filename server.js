const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const { Pool } = require("pg");
const passport = require("passport");
const initializePassport = require("./passportConfig");
const path = require('path');
const fs = require('fs');
const multer = require('multer');

 initializePassport(passport);

const app = express();
const PORT = process.env.PORT || 5000;

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public/uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename to prevent overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    // Check extension and mimetype
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only! (jpeg, jpg, png, gif, webp)'));
    }
};

// Configure multer with storage and file size limits
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// middleware to check if user is authenticated
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "Please log in to view this resource");
    return res.redirect("/users/login");
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/users/dashboard");
    }
    return next();
  }
  
  function checkBusinessAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.type === "business") {
      return next();
    }
    req.flash("error_msg", "Please log in to view this resource");
    return res.redirect("/business/login");
  }

  //=======================GETTING LANDING PAGE==========================
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        // Check user type and redirect accordingly
        if (req.user.type === 'business') {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/users/dashboard');
        }
    }
    res.render('landing');
});

//============================== Routes FOR THE lANDING PAGE =====================

app.get('/users/register', (req, res) => {
    if (req.isAuthenticated()) {
        // Check user type and redirect accordingly
        if (req.user.type === 'business') {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/users/dashboard');
        }
    }
    res.render('login');
});

app.get('/business/register', (req, res) => {
    if (req.isAuthenticated()) {
        // Check user type and redirect accordingly
        if (req.user.type === 'business') {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/users/dashboard');
        }
    }
    res.render('businessLogin');
});

app.get('/users/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
});

app.get('/business/login', checkNotAuthenticated, (req, res) => {
    res.render('businessLogin');
  });

// Add logout route
app.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      req.flash('success_msg', 'You have been logged out');
      res.redirect('/');
    });
});

//==================================REGISTRATION======================
app.post('/users/register', async  (req, res) => {
    let { first_name, last_name, phone_number, email, password, password2 } = req.body;
    console.log({
        first_name, 
        last_name, 
        phone_number, 
        email, 
        password, 
        password2
    });

    let errors = [];

    if (!first_name || !last_name || !phone_number || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters long" });
    }

    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render('login', { errors });
    } else {
        // Form validation has passed
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users
            WHERE email = $1`, [email], (err, results) => {
                if (err) {
                    throw err;
                }

                console.log(results.rows); // Empty array if email is not registered
                
                if (results.rows.length > 0) {
                    errors.push({ message: "Email already registered" });
                    res.render('login', { errors });
                } else {
                    pool.query(
                        `INSERT INTO users (first_name, last_name, phone_number, email, password)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, password`, [first_name, last_name, phone_number, email, hashedPassword], (err, results) => {
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash('success_msg', "You are now registered. Please log in");
                            res.redirect('/users/login');
                        }
                    )
                }
            }
        )
    }
});

app.post('/business/register', async (req, res) => {
    let { business_name, industry, business_email, telephone, password, password2 } = req.body;
    console.log(business_name, industry, business_email, telephone, password, password2);

    let errors = [];

    if (!business_name || !industry || !business_email || !telephone || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters long" });
    }

    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render('businessLogin', { errors });
    } else {
        try {
            // Check if email already exists
            const emailCheck = await pool.query(
                'SELECT * FROM businesses WHERE email = $1',
                [business_email]
            );

            if (emailCheck.rows.length > 0) {
                errors.push({ message: "Email already registered" });
                return res.render('businessLogin', { errors });
            }

        // Form validation has passed
        let hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert the new business
            const results = await pool.query(
                `INSERT INTO businesses (name, email, industry, telephone, password)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, name, email`,
                [business_name, business_email, industry, telephone, hashedPassword]
            );
            
            // Get the new business details
            const newBusiness = results.rows[0];
            
            // Log the user in automatically
            req.login({
                id: newBusiness.id,
                name: newBusiness.name,
                email: newBusiness.email,
                type: 'business'
            }, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    req.flash('success_msg', "Account created! Please log in to complete your profile.");
                    return res.redirect('/business/login');
                }
                
                // Successful login after registration
                req.flash('success_msg', "Account created! Let's complete your business profile.");
                // SETUP BUSINESS PROFILE PAGE
                res.redirect('/admin/setup');
            });
            
        } catch (err) {
            console.error('Registration error:', err);
            errors.push({ message: "An error occurred during registration" });
            res.render('businessLogin', { errors });
        }
    }
});

//=====================================SIGNING IN=========================
app.post('/users/login', passport.authenticate('local-user', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  }));

app.post('/business/login', passport.authenticate('local-business', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/business/login',
    failureFlash: true
  }));
    
                   // Protect your dashboard routes
//==============================ROUTES FOR THE CLIENT SIDE=========================

app.get('/users/dashboard', checkAuthenticated, (req, res) => {
    res.redirect('/users/home');
  });
                 // Add this route after your other routes
app.get('/users/home', checkAuthenticated, async (req, res) => {
    try {
        // Base query for businesses with bookmark status
        let query = `
            SELECT 
                b.id,
                b.name,
                b.industry,
                b.location,
                b.business_logo as logo,
                b.background_image,
                b.description,
                b.rating,
                b.review_count,
                COALESCE(bm.business_id IS NOT NULL, false) as bookmarked
            FROM businesses b
            LEFT JOIN bookmarks bm ON b.id = bm.business_id AND bm.user_id = $1
        `;

        const queryParams = [req.user.id];
        let whereConditions = [];

        // Handle search from the search bar
        if (req.query.q) {
            whereConditions.push(`(
                b.name ILIKE $${queryParams.length + 1} OR 
                b.industry ILIKE $${queryParams.length + 1} OR 
                b.location ILIKE $${queryParams.length + 1}
            )`);
            queryParams.push(`%${req.query.q}%`);
        }

        // Handle industry filter (can be multiple)
        if (req.query.industry) {
            const industries = Array.isArray(req.query.industry) ? req.query.industry : [req.query.industry];
            if (industries.length > 0) {
                const placeholders = industries.map((_, idx) => `$${queryParams.length + 1 + idx}`);
                whereConditions.push(`b.industry = ANY(ARRAY[${placeholders.join(', ')}])`);
                queryParams.push(...industries);
            }
        }

        // Handle location filter
        if (req.query.location) {
            whereConditions.push(`b.location = $${queryParams.length + 1}`);
            queryParams.push(req.query.location);
        }

        // Handle rating filter
        if (req.query.rating) {
            whereConditions.push(`b.rating >= $${queryParams.length + 1}`);
            queryParams.push(parseFloat(req.query.rating));
        }

        // Add WHERE clause if there are any conditions
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        // Add sorting
        const validSortColumns = ['rating', 'review_count', 'name'];
        const sortBy = validSortColumns.includes(req.query.sort) ? req.query.sort : 'rating';
        const sortOrder = req.query.order === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY b.${sortBy} ${sortOrder}`;

        // Execute main query
        const result = await pool.query(query, queryParams);

        // Get filter options
        const industries = await pool.query(`
            SELECT 
                industry,
                COUNT(id) as count
            FROM businesses 
            WHERE industry IS NOT NULL 
            GROUP BY industry 
            ORDER BY industry
        `);

        const locations = await pool.query('SELECT DISTINCT location FROM businesses WHERE location IS NOT NULL ORDER BY location');

        // Get user's bookmarks count
        const bookmarksCount = await pool.query(
            'SELECT COUNT(*) FROM bookmarks WHERE user_id = $1',
            [req.user.id]
        );

        // Render the dashboard with all necessary data
        res.render('userDashboard', {
            user: {
                ...req.user,
                bookmarksCount: bookmarksCount.rows[0].count
            },
            businesses: result.rows,
            filters: {
                industries: industries.rows,
                locations: locations.rows,
                currentIndustry: req.query.industry || [],
                currentLocation: req.query.location,
                currentRating: req.query.rating,
                searchQuery: req.query.q
            },
            sorting: {
                current: sortBy,
                order: sortOrder
            },
            query: req.query,
            path: '/users/home'
        });

    } catch (error) {
        console.error('Error fetching businesses:', error);
        req.flash('error_msg', 'Error loading businesses');
        res.redirect('/users/dashboard');
    }
});
                // Update the search endpoint to redirect to home with search parameters
app.get('/search', checkAuthenticated, (req, res) => {
    const searchQuery = req.query.q;
    res.redirect(`/users/home?q=${encodeURIComponent(searchQuery)}`);
});
                  // Add a route for toggling bookmarks
app.post('/api/toggle-bookmark', checkAuthenticated, async (req, res) => {
    try {
        const { businessId } = req.body;
        const userId = req.user.id;

        console.log('Toggling bookmark:', { userId, businessId }); // Add logging

        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if bookmark exists
            const existingBookmark = await client.query(
                'SELECT * FROM bookmarks WHERE user_id = $1 AND business_id = $2',
                [userId, businessId]
            );

            console.log('Existing bookmark:', existingBookmark.rows); // Add logging

            let bookmarked = false;

            if (existingBookmark.rows.length > 0) {
                // Remove bookmark
                await client.query(
                    'DELETE FROM bookmarks WHERE user_id = $1 AND business_id = $2',
                    [userId, businessId]
                );
                console.log('Bookmark removed'); // Add logging
                } else {
                // Add bookmark
                await client.query(
                    'INSERT INTO bookmarks (user_id, business_id) VALUES ($1, $2)',
                    [userId, businessId]
                );
                bookmarked = true;
                console.log('Bookmark added'); // Add logging
            }

            await client.query('COMMIT');
            res.json({ success: true, bookmarked: bookmarked });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Transaction error:', err); // Add logging
                                throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle bookmark' });
    }
});
                    // Add this route to handle bookmarks page
app.get('/users/bookmarks', checkAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.id,
                b.name,
                b.industry,
                b.location,
                b.business_logo as logo,
                b.background_image,
                b.description,
                b.rating,
                b.review_count,
                true as bookmarked
            FROM businesses b
            INNER JOIN bookmarks bm ON b.id = bm.business_id
            WHERE bm.user_id = $1
            ORDER BY bm.created_at DESC
        `, [req.user.id]);

        res.render('bookmarks', {
            user: req.user,
            bookmarkedBusinesses: result.rows,
            path: '/users/bookmarks'
        });
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        req.flash('error_msg', 'Error loading bookmarks');
        res.redirect('/users/home');
    }
});

//================================ROUTES FOR THE BUSINESS SIDE========================
                    // Add new route for setup page
                        // Modified setup route without ID parameter
                        // Route to get setup page with dynamic regions
app.get('/admin/setup', async (req, res) => {
    // Check if user is logged in and is a business
    if (!req.isAuthenticated() || req.user.type !== 'business') {
        req.flash('error_msg', 'Please log in to access this page');
        return res.redirect('/business/login');
    }
    
    try {
        // Fetch all regions
        const regionsResult = await pool.query('SELECT id, name FROM regions ORDER BY name');
        console.log(regionsResult);
        
        // Fetch business data if needed
        const businessResult = await pool.query(
            'SELECT * FROM businesses WHERE id = $1',
            [req.user.id]
        );
        
        // If the business already has a region selected, fetch its sub-regions
        let subRegions = [];
        if (businessResult.rows[0].region_id) {
            const subRegionsResult = await pool.query(
                'SELECT id, name FROM sub_regions WHERE region_id = $1 ORDER BY name',
                [businessResult.rows[0].region_id]
            );
            subRegions = subRegionsResult.rows;
        }
        
        res.render('businessSetup', {
            business: businessResult.rows[0],
            regions: regionsResult.rows,
            subRegions: subRegions,
            path: '/admin/setup'
        });
    } catch (error) {
        console.error('Error loading setup page:', error);
        req.flash('error_msg', 'Error loading setup page');
        res.redirect('/admin/dashboard');
    }
}); 
                    // API endpoint to get sub-regions for a selected region (for AJAX)
app.get('/api/subregions/:regionId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM sub_regions WHERE region_id = $1 ORDER BY name',
            [req.params.regionId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sub-regions:', error);
        res.status(500).json({ error: 'Failed to fetch sub-regions' });
    }
});
                // Add route to handle the setup form submission
                // Route to handle the setup form submission
app.post('/admin/setup', upload.fields([
    { name: 'businessLogo', maxCount: 1 },
    { name: 'backgroundImage', maxCount: 1 }
 ]), async (req, res) => {
    
        try {
             // Check if user is logged in and is a business
            if (!req.isAuthenticated() || req.user.type !== 'business') {
                    req.flash('error_msg', 'Please log in to access this page');
                    return res.redirect('/business/login');
                 }
                        
            const businessId = req.user.id;
            console.log(req.body);
            console.log(req.files);
            console.log('Updating business profile');
                        
            // Get file paths (or null if no file uploaded)
            const businessLogo = req.files.businessLogo ? 
            '/uploads/' + req.files.businessLogo[0].filename : null;
                        
            const backgroundImage = req.files.backgroundImage ? 
            '/uploads/' + req.files.backgroundImage[0].filename : null;
                        
            // Query current business data to check existing images
            const currentBusiness = await pool.query(
                'SELECT business_logo, background_image FROM businesses WHERE id = $1',
                 [businessId]
            );
                        
            // Check if there are existing images that should be replaced
            if (currentBusiness.rows.length > 0) {
                const currentData = currentBusiness.rows[0];
                            
                // Delete old business logo if a new one was uploaded
                if (businessLogo && currentData.business_logo) {
                    try {
                        const oldLogoPath = path.join(__dirname, 'public', currentData.business_logo);
                        if (fs.existsSync(oldLogoPath)) {
                            fs.unlinkSync(oldLogoPath);
                        }
                    } catch (err) {
                        console.error('Error deleting old logo file:', err);
                    }
                }
                            
                 // Delete old background image if a new one was uploaded
                if (backgroundImage && currentData.background_image) {
                    try {
                        const oldBgPath = path.join(__dirname, 'public', currentData.background_image);
                        if (fs.existsSync(oldBgPath)) {
                            fs.unlinkSync(oldBgPath);
                        }
                    } catch (err) {
                        console.error('Error deleting old background file:', err);
                    }
                }
            }
            // Extract form data
            const { description, telephone, region_id, sub_region_id, location } = req.body;
                        
            console.log(req.user.id);
            console.log('Updating business profile');
                        
            // Update the business record
            await pool.query(
                `UPDATE businesses 
                SET region_id = $1, 
                sub_region_id = $2, 
                location = $3, 
                description = $4,
                telephone = $5,
                business_logo = $6,
                background_image = $7
                WHERE id = $8`,
                [region_id, sub_region_id, location, description, telephone, businessLogo, backgroundImage, req.user.id]
            );
                        
            req.flash('success_msg', 'Business profile completed successfully!');
            res.redirect('/admin/dashboard');
                        
        } catch (err) {
            console.error('Error updating business:', err);
            req.flash('error_msg', 'Failed to update business profile');
            res.redirect('/admin/setup');
        }
    });

app.get('/admin/dashboard', checkBusinessAuthenticated, (req, res) => {
    res.render('adminDashboard', { user: req.user });
  });
  
app.get('/admin/business-model', checkBusinessAuthenticated, (req, res) => {
    console.log(req.user);
    res.render('businessModel', { user: req.user });
});

//==================================SAVE BUSINESS MODEL=========================

app.post('/admin/save-business-model', upload.fields([
    { name: 'businessLogo', maxCount: 1 },
    { name: 'backgroundImage', maxCount: 1 }
]), async (req, res) => {
    try {
        // Make sure user is logged in and is a business
        if (!req.session.user) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/business/login');
        }

        const businessId = req.session.user.id;
        
        // Extract form data
        const { description, telephone } = req.body;
        
        // Get file paths (or null if no file uploaded)
        const businessLogo = req.files.businessLogo ? 
            '/uploads/' + req.files.businessLogo[0].filename : null;
        
        const backgroundImage = req.files.backgroundImage ? 
            '/uploads/' + req.files.backgroundImage[0].filename : null;
        
        // Query current business data to check existing images
        const currentBusiness = await pool.query(
            'SELECT business_logo, background_image FROM businesses WHERE id = $1',
            [businessId]
        );
        
        // Check if there are existing images that should be replaced
        if (currentBusiness.rows.length > 0) {
            const currentData = currentBusiness.rows[0];
            
            // Delete old business logo if a new one was uploaded
            if (businessLogo && currentData.business_logo) {
                try {
                    const oldLogoPath = path.join(__dirname, 'public', currentData.business_logo);
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                    }
                } catch (err) {
                    console.error('Error deleting old logo file:', err);
                }
            }
            
            // Delete old background image if a new one was uploaded
            if (backgroundImage && currentData.background_image) {
                try {
                    const oldBgPath = path.join(__dirname, 'public', currentData.background_image);
                    if (fs.existsSync(oldBgPath)) {
                        fs.unlinkSync(oldBgPath);
                    }
                } catch (err) {
                    console.error('Error deleting old background file:', err);
                }
            }
        }
        
        // Update the business record with new data
        // Only update the fields that were provided (using COALESCE to keep existing values if not provided)
        await pool.query(
            `UPDATE businesses 
             SET business_logo = COALESCE($1, business_logo),
                 background_image = COALESCE($2, background_image),
                 description = COALESCE($3, description),
                 telephone = COALESCE($4, telephone)
             WHERE id = $5`,
            [
                businessLogo, 
                backgroundImage, 
                description, 
                telephone,
                businessId
            ]
        );
        
        req.flash('success_msg', 'Business profile updated successfully');
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error saving business model:', error);
        req.flash('error_msg', 'Error updating business profile');
        res.redirect('/admin/business-model');
    }
});


// Route for saving business profile
app.post('/admin/save-business-profile', upload.fields([
    { name: 'businessLogo', maxCount: 1 },
    { name: 'backgroundImage', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/business/login');
        }

        const businessId = req.user.id;
        const { businessName, description, location, phone } = req.body;
        
        // Handle file uploads
        const businessLogo = req.files.businessLogo ? 
            '/uploads/' + req.files.businessLogo[0].filename : null;
        const backgroundImage = req.files.backgroundImage ? 
            '/uploads/' + req.files.backgroundImage[0].filename : null;

        // Get current business data to check existing images
        const currentBusiness = await pool.query(
            'SELECT business_logo, background_image FROM businesses WHERE id = $1',
            [businessId]
        );

        // Handle deletion of old images if new ones are uploaded
        if (currentBusiness.rows.length > 0) {
            const currentData = currentBusiness.rows[0];
            
            if (businessLogo && currentData.business_logo) {
                const oldLogoPath = path.join(__dirname, 'public', currentData.business_logo);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                }
            }
            
            if (backgroundImage && currentData.background_image) {
                const oldBgPath = path.join(__dirname, 'public', currentData.background_image);
                if (fs.existsSync(oldBgPath)) {
                    fs.unlinkSync(oldBgPath);
                }
            }
        }

        // Update business profile
        await pool.query(
            `UPDATE businesses 
             SET name = COALESCE($1, name),
                 business_logo = COALESCE($2, business_logo),
                 background_image = COALESCE($3, background_image),
                 description = COALESCE($4, description),
                 location = COALESCE($5, location),
                 telephone = COALESCE($6, telephone)
             WHERE id = $7`,
            [businessName, businessLogo, backgroundImage, description, location, phone, businessId]
        );

        req.flash('success_msg', 'Business profile updated successfully');
        res.redirect('/admin/business-model');
    } catch (error) {
        console.error('Error saving business profile:', error);
        req.flash('error_msg', 'Error updating business profile');
        res.redirect('/admin/business-model');
    }
});

// Route for saving services
app.post('/admin/save-services', upload.array('serviceImage[]'), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Please log in first');
            return res.redirect('/business/login');
        }

        const businessId = req.user.id;
        const { serviceName, staffCount, duration, price } = req.body;
        const files = req.files;

        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // First, delete existing services for this business
            await client.query(
                'DELETE FROM business_services WHERE business_id = $1',
                [businessId]
            );

            // Insert new services
            for (let i = 0; i < serviceName.length; i++) {
                const serviceImage = files[i] ? '/uploads/' + files[i].filename : null;
                
                await client.query(
                    `INSERT INTO business_services 
                     (business_id, service, staff_count, duration_minutes, price, service_image)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        businessId,
                        serviceName[i],
                        staffCount[i],
                        duration[i],
                        price[i],
                        serviceImage
                    ]
                );
            }

            await client.query('COMMIT');
            req.flash('success_msg', 'Services updated successfully');
            res.redirect('/admin/business-model');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error saving services:', error);
        req.flash('error_msg', 'Error updating services');
        res.redirect('/admin/business-model');
    }
});



app.get('/business/:id', checkAuthenticated, async (req, res) => {
    try {
        // Get business details including bookmark status
        const result = await pool.query(`
            SELECT 
                b.*,
                COALESCE(bm.business_id IS NOT NULL, false) as bookmarked
            FROM businesses b
            LEFT JOIN bookmarks bm ON b.id = bm.business_id AND bm.user_id = $1
            WHERE b.id = $2
        `, [req.user.id, req.params.id]);

        if (result.rows.length === 0) {
            req.flash('error_msg', 'Business not found');
            return res.redirect('/users/home');
        }

        // Get services for the business
        const services = await pool.query(`
            SELECT * FROM business_services
            WHERE business_id = $1
            ORDER BY service
        `, [req.params.id]);

        const business = {
            ...result.rows[0],
            logo: result.rows[0].business_logo?.replace('/uploads/', ''),
            background_image: result.rows[0].background_image?.replace('/uploads/', ''),
            services: services.rows
        };

        res.render('businessProfile', {
            user: req.user,
            business,
            path: `/business/${req.params.id}`,
            filters: {}
        });
    } catch (error) {
        console.error('Error fetching business profile:', error);
        req.flash('error_msg', 'Error loading business profile');
        res.redirect('/users/home');
    }
});







app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}  );