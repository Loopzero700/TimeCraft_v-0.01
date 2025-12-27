 const cancelBtn = document.querySelectorAll('[data-id]')
  cancelBtn.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault()
      const itemId = e.currentTarget.dataset.id
      const orderId = "<%= data._id %>"

      Swal.fire({
        title: 'Are you sure?',
        text: "This will cancel the item.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff3d3d',
        cancelButtonColor: '#a5a5a5',
        confirmButtonText: 'Yes, cancel!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch('/itemCancel',{
              method: "PATCH",
              headers: { 'Content-Type': 'application/json'},
              body: JSON.stringify({itemId,orderId})
            })
            console.log("itemId:",itemId,"orderId:",orderId)
            const data = await response.json()

            if (response.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Cancelled!',
                text: data.message || 'Item has been cancelled successfully.',
                confirmButtonColor: '#3085d6'
              }).then(() => {
                
                const status = document.querySelector((`[id="${itemId}"]`))
                status.textContent = 'Cancelled'
                btn.style.display = 'none'
              })
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || 'Something went wrong!'
              })
            }

          } catch (error) {
            console.error(error)
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to cancel the item. Please try again.'
            })
          }
        }
      })
    })
  })

  const returnBtn = document.querySelectorAll('[data-rid]')
  returnBtn.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault()
      const itemId = e.currentTarget.dataset.rid
      const orderId = "<%= data._id %>"

      Swal.fire({
           title: 'Enter your reason for return',
           input: 'textarea',
           inputPlaceholder: 'Type your comments here...',
           inputAttributes: {'aria-label': 'Type your comments here'},
           showCancelButton: true,
           confirmButtonText: 'Submit',
           cancelButtonText: 'Cancel'
         }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch('/itemReturn',{
              method: "PATCH",
              headers: { 'Content-Type': 'application/json'},
              body: JSON.stringify({itemId,orderId,reason:result.value})
            })
            console.log("itemId:",itemId,"orderId:",orderId)
            const data = await response.json()

            if (response.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Return!',
                text: data.message || ' Return request has been successfully submitted.',
                confirmButtonColor: '#3085d6'
              }).then(() => {
                
                const status = document.querySelector((`[id="${itemId}"]`))
                status.textContent = 'Return'
                btn.style.display = 'none'
              })
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || 'Something went wrong!'
              })
            }

          } catch (error) {
            console.error(error)
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'We couldn’t process your return. Please try again later.'
            })
          }
        }
      })
    })
  })