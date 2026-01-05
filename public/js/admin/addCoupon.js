 const form = document.getElementById('form')
    const couponCode = document.querySelector('#coupon-code')
    const discountType = document.querySelector('#discount-type')
    const discountAmount = document.querySelector('#discount-amount')
    const expiryDate = document.querySelector('#expiry-date')
    const maxUsers = document.querySelector('#max-users')
    const maxDiscount = document.querySelector('#maxDiscount')
    const minPurchase = document.querySelector('#min-purchase')
    const description = document.querySelector('#coupon-description')


    
    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        function showError(inputId, message) {
        const errorElement = document.getElementById(`error-${inputId}`)
        errorElement.textContent = message
        errorElement.classList.remove("hidden")
    }
    
    function clearErrors() {
        document.querySelectorAll("p[id^='error']").forEach(el => {
            el.textContent = ""
            el.classList.add("hidden")
        })
    }

            clearErrors()
        let hasError = false
        
        if (!couponCode.value.trim()) {
            showError("coupon-code", "Coupon code is required.")
            hasError = true
        }
        
        if (!discountAmount.value || discountAmount.value <= 0) {
            showError("discount-amount", "Discount must be greater than 0.")
            hasError = true
        }
        
        if (discountType.value === "fixed" && Number(discountAmount.value) > 5000) {
            showError("discount-amount", "Fixed discount cannot exceed ₹5000.")
            hasError = true
        }
        
        if (discountType.value === "percentage" && Number(discountAmount.value) > 90) {
            showError("discount-amount", "Percentage discount cannot exceed 90%.")
            hasError = true
        }
        
        const today = new Date().setHours(0,0,0,0)
        const selected = new Date(expiryDate.value).setHours(0,0,0,0)
        
        if (!expiryDate.value || selected <= today) {
            showError("expiry-date", "Expiry date must be a future date.")
            hasError = true
        }
        
        if (!maxUsers.value && maxUsers.value <= 0) {
            showError("max-users", "Max users must be greater than zero.")
            hasError = true
        }
        
        if (!maxDiscount.value && maxDiscount.value <= 0) {
            showError("maxDiscount", "Max discount must be greater than zero.")
            hasError = true
        }
        
        if (!minPurchase.value && minPurchase.value <= 0) {
            showError("min-purchase", "Minimum purchase must be greater than zero.")
            hasError = true
        }

        if (discountType.value === 'fixed' && 
            Number(minPurchase.value) <= Number(discountAmount.value)) {
            showError("min-purchase", "For fixed coupons, minimum purchase must be greater than the discount amount.")
            hasError = true
        }
        
        if (hasError) return
        
        
        try {
            const formData = new FormData(form)
            const data = Object.fromEntries(formData.entries())
            
            const response = await fetch('addcoupon', {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                Swal.fire({
                    title: "Success!",
                    text: "Coupon added successfully.", 
                    icon: "success",
                    button: "Awesome!",
                    timer: 2000
                }).then(() => {
                    window.location.href = '/admin/coupon'
                })
            } else {
                
                const errorData = await response.json()
                Swal.fire({
                    title: "Error!",
                    text: errorData.message || "Something went wrong.",
                    icon: "error",
                    button: "Try Again",
                })
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            Swal.fire({
                title: "Network Error!",
                text: "Could not connect to the server. Please try again later.",
                icon: "error",
                button: "OK",
            })
        }
    })