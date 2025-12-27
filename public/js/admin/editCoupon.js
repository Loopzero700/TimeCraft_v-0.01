 const form = document.getElementById('form')
    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        try {
            const formData = new FormData(form)
            const data = Object.fromEntries(formData.entries())
            const couponId = data.couponId
            
            const response = await fetch(`/admin/editcoupon/${couponId}`, {
                method: "PATCH", 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                Swal.fire({
                    title: "Success!",
                    text: "Coupon updated successfully.", 
                    icon: "success",
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
                })
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            Swal.fire({
                title: "Network Error!",
                text: "Could not connect to the server. Please try again later.",
                icon: "error",
            })
        }
    })