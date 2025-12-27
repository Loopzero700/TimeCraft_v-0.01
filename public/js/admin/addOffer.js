 const form = document.getElementById('offerForm')
  const offerName = document.getElementById('offer-name')
  const startDate = document.getElementById('start-date')
  const expiryDate = document.getElementById('expiry-date')
  const offerTypeSelect = document.getElementById('offer-type')
  const discount = document.getElementById('discount-percentage')
  const description = document.getElementById('offer-description')
  const offerProductContainer = document.getElementById('offer-product-container')
  const offerCategoryContainer = document.getElementById('offer-category-container')
  const offerProductSelect = document.getElementById('offer-for-product')
  const offerCategorySelect = document.getElementById('offer-for-category')


  function createError(id) {
    let error = document.createElement('div')
    error.id = id
    error.className = 'text-red-400 text-sm mt-1'
    return error
  }

  
  const fields = [
    { el: offerName, id: 'errorName' },
    { el: startDate, id: 'errorStart' },
    { el: expiryDate, id: 'errorExpiry' },
    { el: offerTypeSelect, id: 'errorType' },
    { el: offerProductSelect, id: 'errorOfferForProduct' }, 
    { el: offerCategorySelect, id: 'errorOfferForCategory' },
    { el: discount, id: 'errorDiscount' },
  ]

  fields.forEach(({ el, id }) => {
    if (!document.getElementById(id)) {
      el.insertAdjacentElement('afterend', createError(id))
    }
  });

  
  function setInitialOfferState() {
    offerProductContainer.style.display = 'none'
    offerCategoryContainer.style.display = 'none'
    offerProductSelect.disabled = true
    offerCategorySelect.disabled = true
  }
  setInitialOfferState()

  offerTypeSelect.addEventListener('change', () => {
    const selected = offerTypeSelect.value
    setInitialOfferState()

    if (selected === 'Category') {
      offerCategoryContainer.style.display = 'block'
      offerCategorySelect.disabled = false
    } else if (selected === 'Product') {
      offerProductContainer.style.display = 'block'
      offerProductSelect.disabled = false
    }
  })

  function validateOfferName() {
    const val = offerName.value.trim()
    const pattern = /^[A-Za-z0-9\s\-_,.]+$/
    const error = document.getElementById('errorName')
    if (!val) {
      error.textContent = 'Please enter offer name'
    } else if (!pattern.test(val)) {
      error.textContent = 'Offer name contains invalid characters'
    } else {
      error.textContent = '';
    }
  }

  function validateDates() {
    const startVal = startDate.value
    const expiryVal = expiryDate.value
    const startError = document.getElementById('errorStart')
    const expiryError = document.getElementById('errorExpiry')
    const today = new Date().setHours(0, 0, 0, 0)

    if (!startVal) {
        startError.textContent = 'Please select start date'
    } else if (new Date(startVal) < today) {
        startError.textContent = 'Start date cannot be in the past'
    } else {
        startError.textContent = ''
    }

    if (!expiryVal) {
      expiryError.textContent = 'Please select expiry date'
    } else if (startVal && new Date(expiryVal) <= new Date(startVal)) {
      expiryError.textContent = 'Expiry date must be after start date'
    } else {
      expiryError.textContent = ''
    }
  }

  function validateType() {
    const val = offerTypeSelect.value;
    const error = document.getElementById('errorType')
    if (!val) {
      error.textContent = 'Please select offer type'
    } else {
      error.textContent = ''
    }
  }

  function validateOfferFor() {
    const type = offerTypeSelect.value;
    if (type === 'Product') {
      const val = offerProductSelect.value;
      const error = document.getElementById('errorOfferForProduct')
      error.textContent = !val ? 'Please select a product' : ''
    } else if (type === 'Category') {
      const val = offerCategorySelect.value
      const error = document.getElementById('errorOfferForCategory')
      error.textContent = !val ? 'Please select a category' : ''
    }
  }

  function validateDiscount() {
    const val = discount.value.trim()
    const error = document.getElementById('errorDiscount')
    if (val === '') { 
      error.textContent = 'Please enter discount percentage'
    } else if (val < 0 || val > 90) {
      error.textContent = 'Discount must be between 0 and 90'
    } else {
      error.textContent = ''
    }
  }
  

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    validateOfferName()
    validateDates()
    validateType()
    validateOfferFor()
    validateDiscount()

    const hasError = Array.from(document.querySelectorAll('.text-red-400'))
      .some(el => el.textContent !== '')

    if (hasError) return

    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/admin/addOffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Offer added successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = '/admin/offer';
        })
      } else {
        const err = await response.json();
        Swal.fire({
          title: 'Error!',
          text: err.message || 'Something went wrong.',
          icon: 'error',
        })
      }
    } catch (err) {
      console.log(err)
      Swal.fire({
        title: 'Error!',
        text: 'Server error. Please try again later.',
        icon: 'error',
      })
    }
  })