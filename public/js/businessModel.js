// Business Model Page JavaScript
$(document).ready(function() {
    // Initialize variables to store data
    let categories = [];
    let services = [];
    let branches = [];
    let tempServiceImages = [];
    
    // Load initial data
    loadCategories();
    loadBranches();
    
    // Profile image preview handlers
    $('#businessLogo').change(function() {
        previewImage(this, '#logoPreview');
    });
    
    $('#backgroundImage').change(function() {
        previewImage(this, '#backgroundPreview');
    });
    
    // Service type radio buttons change handler
    $('input[name="serviceType"]').change(function() {
        if ($(this).val() === 'mobile' || $(this).val() === 'both') {
            $('#mobileOptions').removeClass('d-none');
        } else {
            $('#mobileOptions').addClass('d-none');
        }
    });
    
    // Day status toggle handler
    $('.form-check-input').change(function() {
        const label = $(this).siblings('.day-status');
        if ($(this).is(':checked')) {
            label.text('Open').removeClass('text-danger').addClass('text-success');
        } else {
            label.text('Closed').removeClass('text-success').addClass('text-danger');
        }
    });
    
    // "Save All Changes" button handler
    $('.save-all-btn').click(function() {
        // Submit all forms sequentially
        submitAllForms();
    });
    
    // Category Modal
    $('#addCategoryBtn').click(function() {
        // Reset form for new category
        $('#categoryModalTitle').text('Add Service Category');
        $('#categoryId').val('');
        $('#categoryForm')[0].reset();
        $('#categoryModal').modal('show');
    });
    
    // Save Category button handler
    $('#saveCategoryBtn').click(function() {
        const categoryId = $('#categoryId').val();
        const name = $('#categoryName').val();
        const description = $('#categoryDescription').val();
        
        if (!name) {
            alert('Category name is required!');
            return;
        }
        
        if (categoryId) {
            // Edit existing category
            updateCategory(categoryId, name, description);
        } else {
            // Add new category
            addCategory(name, description);
        }
        
        $('#categoryModal').modal('hide');
    });
    
    // Service Modal
    $(document).on('click', '.add-service-btn', function() {
        const categoryId = $(this).data('category-id');
        
        // Reset form for new service
        $('#serviceModalTitle').text('Add Service');
        $('#serviceId').val('');
        $('#serviceCategoryId').val(categoryId);
        $('#serviceForm')[0].reset();
        $('#serviceDuration').val(30);
        $('#staffRequired').val(1);
        
        // Clear image previews
        tempServiceImages = [];
        refreshServiceImagePreviews();
        
        $('#serviceModal').modal('show');
    });
    
    // Edit Service button handler
    $(document).on('click', '.edit-service-btn', function() {
        const serviceId = $(this).data('service-id');
        const service = services.find(s => s.id.toString() === serviceId.toString());
        
        if (service) {
            $('#serviceModalTitle').text('Edit Service');
            $('#serviceId').val(serviceId);
            $('#serviceCategoryId').val(service.category_id);
            $('#serviceName').val(service.name);
            $('#serviceDescription').val(service.description || '');
            $('#servicePrice').val(service.price);
            $('#serviceDuration').val(service.duration_minutes);
            $('#staffRequired').val(service.staff_count);
            
            // Load service images
            tempServiceImages = service.images || [];
            refreshServiceImagePreviews();
            
            $('#serviceModal').modal('show');
        }
    });
    
    // Edit Category button handler
    $(document).on('click', '.edit-category-btn', function() {
        const categoryId = $(this).data('category-id');
        const category = categories.find(c => c.id.toString() === categoryId.toString());
        
        if (category) {
            $('#categoryModalTitle').text('Edit Service Category');
            $('#categoryId').val(categoryId);
            $('#categoryName').val(category.name);
            $('#categoryDescription').val(category.description || '');
            
            $('#categoryModal').modal('show');
        }
    });
    
    // Delete Category button handler
    $(document).on('click', '.delete-category-btn', function() {
        const categoryId = $(this).data('category-id');
        
        if (confirm('Are you sure you want to delete this category and all its services?')) {
            deleteCategory(categoryId);
        }
    });
    
    // Delete Service button handler
    $(document).on('click', '.delete-service-btn', function() {
        const serviceId = $(this).data('service-id');
        
        if (confirm('Are you sure you want to delete this service?')) {
            deleteService(serviceId);
        }
    });
    
    // Service Image Upload handler
    $('#serviceImageUpload').change(function() {
        handleServiceImageUpload(this.files);
    });
    
    // Save Service button handler
    $('#saveServiceBtn').click(function() {
        const serviceId = $('#serviceId').val();
        const categoryId = $('#serviceCategoryId').val();
        const name = $('#serviceName').val();
        const description = $('#serviceDescription').val();
        const price = $('#servicePrice').val();
        const duration = $('#serviceDuration').val();
        const staffCount = $('#staffRequired').val();
        
        if (!name || !price || !duration || !staffCount) {
            alert('Please fill in all required fields!');
            return;
        }
        
        const serviceData = {
            id: serviceId || null,
            category_id: categoryId,
            name: name,
            description: description,
            price: parseFloat(price),
            duration_minutes: parseInt(duration),
            staff_count: parseInt(staffCount),
            images: tempServiceImages
        };
        
        if (serviceId) {
            // Update existing service
            updateService(serviceData);
        } else {
            // Add new service
            addService(serviceData);
        }
        
        $('#serviceModal').modal('hide');
    });
    
    // Branch Modal
    $('#addBranchBtn').click(function() {
        // Reset form for new branch
        $('#branchModalTitle').text('Add Branch');
        $('#branchId').val('');
        $('#branchForm')[0].reset();
        $('#branchModal').modal('show');
    });
    
    // Edit Branch button handler
    $(document).on('click', '.edit-branch-btn', function() {
        const branchId = $(this).data('branch-id');
        const branch = branches.find(b => b.id.toString() === branchId.toString());
        
        if (branch) {
            $('#branchModalTitle').text('Edit Branch');
            $('#branchId').val(branchId);
            $('#branchName').val(branch.name);
            $('#branchAddress').val(branch.address || '');
            $('#branchTelephone').val(branch.telephone || '');
            $('#isPrimaryBranch').prop('checked', branch.is_primary);
            
            $('#branchModal').modal('show');
        }
    });
    
    // Delete Branch button handler
    $(document).on('click', '.delete-branch-btn', function() {
        const branchId = $(this).data('branch-id');
        
        if (confirm('Are you sure you want to delete this branch?')) {
            deleteBranch(branchId);
        }
    });
    
    // Save Branch button handler
    $('#saveBranchBtn').click(function() {
        const branchId = $('#branchId').val();
        const name = $('#branchName').val();
        const address = $('#branchAddress').val();
        const telephone = $('#branchTelephone').val();
        const isPrimary = $('#isPrimaryBranch').is(':checked');
        
        if (!name || !address || !telephone) {
            alert('Please fill in all required fields!');
            return;
        }
        
        const branchData = {
            id: branchId || null,
            name: name,
            address: address,
            telephone: telephone,
            is_primary: isPrimary
        };
        
        if (branchId) {
            // Update existing branch
            updateBranch(branchData);
        } else {
            // Add new branch
            addBranch(branchData);
        }
        
        $('#branchModal').modal('hide');
    });
    
    // FUNCTIONS
    
    // Preview uploaded image
    function previewImage(input, previewSelector) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewDiv = $(previewSelector);
                previewDiv.html(`<img src="${e.target.result}" alt="Preview">`);
            }
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // Load categories and services
    function loadCategories() {
        $.ajax({
            url: '/admin/get-categories-services',
            type: 'GET',
            success: function(data) {
                categories = data.categories || [];
                services = data.services || [];
                
                renderCategories();
            },
            error: function(xhr) {
                console.error('Error loading categories:', xhr);
            }
        });
    }
    
    // Render categories
    function renderCategories() {
        const container = $('#categoriesContainer');
        
        if (categories.length === 0) {
            $('#noCategoriesMessage').show();
            return;
        }
        
        $('#noCategoriesMessage').hide();
        
        // Clear container
        container.empty();
        
        // Render each category
        categories.forEach(category => {
            const categoryServices = services.filter(s => s.category_id === category.id);
            
            const categoryHtml = `
                <div class="service-category" data-category-id="${category.id}">
                    <div class="category-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h4>${category.name}</h4>
                            <div class="category-actions">
                                <button class="btn btn-sm btn-outline-primary add-service-btn" data-category-id="${category.id}">
                                    <i class="fas fa-plus"></i> Add Service
                                </button>
                                <button class="btn btn-sm btn-outline-secondary edit-category-btn" data-category-id="${category.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-category-btn" data-category-id="${category.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ${category.description ? `<p class="text-muted">${category.description}</p>` : ''}
                    </div>
                    
                    <div class="services-container">
                        ${categoryServices.length === 0 ? 
                            `<div class="empty-service text-center p-3 mb-3 bg-light rounded">
                                <p class="mb-0 text-muted">No services in this category yet.</p>
                            </div>` : 
                            renderServices(categoryServices)}
                    </div>
                </div>
                <hr>
            `;
            
            container.append(categoryHtml);
        });
    }
    
    // Render services for a category
    function renderServices(services) {
        let html = '<div class="row">';
        
        services.forEach(service => {
            const imageSrc = service.images && service.images.length > 0 ? 
                service.images[0].image_path : 
                '/img/service-placeholder.jpg';
            
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="service-card card h-100">
                        <div class="service-img-container">
                            <img src="${imageSrc}" class="card-img-top service-img" alt="${service.name}">
                            ${service.images && service.images.length > 1 ? 
                                `<span class="img-count"><i class="fas fa-images"></i> ${service.images.length}</span>` : ''}
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${service.name}</h5>
                            ${service.description ? `<p class="card-text small">${service.description}</p>` : ''}
                            <div class="service-details">
                                <div class="service-price">KSH ${service.price.toFixed(2)}</div>
                                <div class="service-duration"><i class="far fa-clock"></i> ${service.duration_minutes} mins</div>
                            </div>
                        </div>
                        <div class="card-footer bg-white">
                            <div class="d-flex justify-content-between">
                                <span class="text-muted small"><i class="fas fa-users"></i> Staff: ${service.staff_count}</span>
                                <div>
                                    <button class="btn btn-sm btn-link edit-service-btn" data-service-id="${service.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-link text-danger delete-service-btn" data-service-id="${service.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Add a new category
    function addCategory(name, description) {
        const newCategory = {
            name: name,
            description: description
        };
        
        // Send to server
        $.ajax({
            url: '/admin/add-category',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newCategory),
            success: function(data) {
                if (data.success) {
                    // Add to local array with ID from server
                    categories.push(data.category);
                    renderCategories();
                } else {
                    alert(data.message || 'Failed to add category');
                }
            },
            error: function(xhr) {
                console.error('Error adding category:', xhr);
                alert('Failed to add category. Please try again.');
            }
        });
    }
    
    // Update existing category
    function updateCategory(id, name, description) {
        const updatedCategory = {
            id: id,
            name: name,
            description: description
        };
        
        // Send to server
        $.ajax({
            url: '/admin/update-category',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedCategory),
            success: function(data) {
                if (data.success) {
                    // Update local array
                    const index = categories.findIndex(c => c.id.toString() === id.toString());
                    if (index !== -1) {
                        categories[index] = updatedCategory;
                    }
                    renderCategories();
                } else {
                    alert(data.message || 'Failed to update category');
                }
            },
            error: function(xhr) {
                console.error('Error updating category:', xhr);
                alert('Failed to update category. Please try again.');
            }
        });
    }
    
    // Delete category
    function deleteCategory(id) {
        // Send to server
        $.ajax({
            url: `/admin/delete-category/${id}`,
            type: 'DELETE',
            success: function(data) {
                if (data.success) {
                    // Remove from local array
                    categories = categories.filter(c => c.id.toString() !== id.toString());
                    // Also remove all services in this category
                    services = services.filter(s => s.category_id.toString() !== id.toString());
                    renderCategories();
                } else {
                    alert(data.message || 'Failed to delete category');
                }
            },
            error: function(xhr) {
                console.error('Error deleting category:', xhr);
                alert('Failed to delete category. Please try again.');
            }
        });
    }
    
    // Add a new service
    function addService(serviceData) {
        // Send to server
        $.ajax({
            url: '/admin/add-service',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(serviceData),
            success: function(data) {
                if (data.success) {
                    // Add to local array with ID from server
                    services.push(data.service);
                    renderCategories();
                } else {
                    alert(data.message || 'Failed to add service');
                }
            },
            error: function(xhr) {
                console.error('Error adding service:', xhr);
                alert('Failed to add service. Please try again.');
            }
        });
    }
    
    // Update existing service
    function updateService(serviceData) {
        // Send to server
        $.ajax({
            url: '/admin/update-service',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(serviceData),
            success: function(data) {
                if (data.success) {
                    // Update local array
                    const index = services.findIndex(s => s.id.toString() === serviceData.id.toString());
                    if (index !== -1) {
                        services[index] = serviceData;
                    }
                    renderCategories();
                } else {
                    alert(data.message || 'Failed to update service');
                }
            },
            error: function(xhr) {
                console.error('Error updating service:', xhr);
                alert('Failed to update service. Please try again.');
            }
        });
    }
    
    // Delete service
    function deleteService(id) {
        // Send to server
        $.ajax({
            url: `/admin/delete-service/${id}`,
            type: 'DELETE',
            success: function(data) {
                if (data.success) {
                    // Remove from local array
                    services = services.filter(s => s.id.toString() !== id.toString());
                    renderCategories();
                } else {
                    alert(data.message || 'Failed to delete service');
                }
            },
            error: function(xhr) {
                console.error('Error deleting service:', xhr);
                alert('Failed to delete service. Please try again.');
            }
        });
    }
    
    // Handle service image upload
    function handleServiceImageUpload(files) {
        if (!files || files.length === 0) return;
        
        // Check maximum number of images (limit to 5)
        if (tempServiceImages.length + files.length > 5) {
            alert('Maximum 5 images allowed per service');
            return;
        }
        
        // Convert FileList to Array
        const fileArray = Array.from(files);
        
        // Process each file
        fileArray.forEach(file => {
            // Read and create preview
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create temporary object for the image
                const tempImage = {
                    id: 'temp_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 5),
                    file: file,
                    preview: e.target.result,
                    is_primary: tempServiceImages.length === 0 // First image is primary by default
                };
                
                tempServiceImages.push(tempImage);
                refreshServiceImagePreviews();
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Refresh service image previews
    function refreshServiceImagePreviews() {
        const container = $('#imagePreviewsContainer');
        
        // Clear existing previews except the add button
        container.find('.image-preview-item').remove();
        
        // Add preview for each image
        tempServiceImages.forEach((image, index) => {
            const imageSrc = image.preview || image.image_path;
            const isPrimary = image.is_primary;
            
            const imageHtml = `
                <div class="image-preview-item" data-image-id="${image.id}">
                    <div class="image-preview-container">
                        <img src="${imageSrc}" alt="Service Image">
                        ${isPrimary ? '<span class="primary-badge">Primary</span>' : ''}
                        <div class="image-actions">
                            ${!isPrimary ? 
                                `<button type="button" class="btn btn-sm btn-primary make-primary-btn" data-image-id="${image.id}">
                                    <i class="fas fa-star"></i>
                                </button>` : ''}
                            <button type="button" class="btn btn-sm btn-danger remove-image-btn" data-image-id="${image.id}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.prepend(imageHtml);
        });
        
        // Event handlers for image actions
        $('.make-primary-btn').click(function() {
            const imageId = $(this).data('image-id');
            setServiceImageAsPrimary(imageId);
        });
        
        $('.remove-image-btn').click(function() {
            const imageId = $(this).data('image-id');
            removeServiceImage(imageId);
        });
    }
    
    // Set service image as primary
    function setServiceImageAsPrimary(imageId) {
        // Update tempServiceImages array
        tempServiceImages.forEach(image => {
            image.is_primary = image.id.toString() === imageId.toString();
        });
        
        refreshServiceImagePreviews();
    }
    
    // Remove service image
    function removeServiceImage(imageId) {
        // Check if it's the primary image
        const isPrimary = tempServiceImages.find(img => img.id.toString() === imageId.toString())?.is_primary;
        
        // Remove from array
        tempServiceImages = tempServiceImages.filter(img => img.id.toString() !== imageId.toString());
        
        // If it was primary and we have other images, set the first one as primary
        if (isPrimary && tempServiceImages.length > 0) {
            tempServiceImages[0].is_primary = true;
        }
        
        refreshServiceImagePreviews();
    }
    
    // Load branches
    function loadBranches() {
        $.ajax({
            url: '/admin/get-branches',
            type: 'GET',
            success: function(data) {
                branches = data.branches || [];
                
                renderBranches();
            },
            error: function(xhr) {
                console.error('Error loading branches:', xhr);
            }
        });
    }
    
    // Render branches
    function renderBranches() {
        const container = $('#branchesContainer');
        
        if (branches.length === 0) {
            $('#noBranchesMessage').show();
            return;
        }
        
        $('#noBranchesMessage').hide();
        
        // Clear container
        container.empty();
        
        // Render each branch
        let html = '<div class="row">';
        
        branches.forEach(branch => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100 ${branch.is_primary ? 'border-primary' : ''}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${branch.name}</h5>
                            ${branch.is_primary ? '<span class="badge bg-primary">Primary</span>' : ''}
                        </div>
                        <div class="card-body">
                            <p><i class="fas fa-map-marker-alt"></i> ${branch.address || 'No address provided'}</p>
                            <p><i class="fas fa-phone"></i> ${branch.telephone || 'No telephone provided'}</p>
                        </div>
                        <div class="card-footer bg-white">
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-sm btn-outline-secondary me-2 edit-branch-btn" data-branch-id="${branch.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-branch-btn" data-branch-id="${branch.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.append(html);
    }
    
    // Add a new branch
    function addBranch(branchData) {
        // If this is marked as primary, update all others
        if (branchData.is_primary) {
            branches.forEach(branch => {
                branch.is_primary = false;
            });
        }
        
        // Send to server
        $.ajax({
            url: '/admin/add-branch',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(branchData),
            success: function(data) {
                if (data.success) {
                    // Add to local array with ID from server
                    branches.push(data.branch);
                    renderBranches();
                } else {
                    alert(data.message || 'Failed to add branch');
                }
            },
            error: function(xhr) {
                console.error('Error adding branch:', xhr);
                alert('Failed to add branch. Please try again.');
            }
        });
    }
    
    // Update existing branch
    function updateBranch(branchData) {
        // If this is marked as primary, update all others
        if (branchData.is_primary) {
            branches.forEach(branch => {
                if (branch.id.toString() !== branchData.id.toString()) {
                    branch.is_primary = false;
                }
            });
        }
        
        // Send to server
        $.ajax({
            url: '/admin/update-branch',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(branchData),
            success: function(data) {
                if (data.success) {
                    // Update local array
                    const index = branches.findIndex(b => b.id.toString() === branchData.id.toString());
                    if (index !== -1) {
                        branches[index] = branchData;
                    }
                    renderBranches();
                } else {
                    alert(data.message || 'Failed to update branch');
                }
            },
            error: function(xhr) {
                console.error('Error updating branch:', xhr);
                alert('Failed to update branch. Please try again.');
            }
        });
    }
    
    // Delete branch
    function deleteBranch(id) {
        // Check if it's the primary branch
        const isPrimary = branches.find(b => b.id.toString() === id.toString())?.is_primary;
        
        if (isPrimary && branches.length > 1) {
            alert('You cannot delete the primary branch. Please set another branch as primary first.');
            return;
        }
        
        // Send to server
        $.ajax({
            url: `/admin/delete-branch/${id}`,
            type: 'DELETE',
            success: function(data) {
                if (data.success) {
                    // Remove from local array
                    branches = branches.filter(b => b.id.toString() !== id.toString());
                    renderBranches();
                } else {
                    alert(data.message || 'Failed to delete branch');
                }
            },
            error: function(xhr) {
                console.error('Error deleting branch:', xhr);
                alert('Failed to delete branch. Please try again.');
            }
        });
    }
    
    // Submit all forms
    function submitAllForms() {
        // Prepare services data for submission
        $('#categoriesData').val(JSON.stringify(categories));
        $('#servicesData').val(JSON.stringify(services));
        
        // Prepare branches data for submission
        $('#branchesData').val(JSON.stringify(branches));
        
        // Submit forms sequentially
        const profileForm = $('#profileForm');
        const scheduleForm = $('#scheduleForm');
        const deliveryForm = $('#deliveryForm');
        const servicesForm = $('#servicesForm');
        const branchesForm = $('#branchesForm');
        
        // Submit profile form first
        profileForm.submit();
        
        // Submit other forms with slight delay to prevent overload
        setTimeout(() => {
            scheduleForm.submit();
        }, 500);
        
        setTimeout(() => {
            deliveryForm.submit();
        }, 1000);
        
        setTimeout(() => {
            servicesForm.submit();
        }, 1500);
        
        setTimeout(() => {
            branchesForm.submit();
        }, 2000);
    }
});