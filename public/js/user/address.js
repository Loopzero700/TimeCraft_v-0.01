document.addEventListener('DOMContentLoaded', () => {

  const addaddress = document.getElementById('add-address')
  if (addaddress) {
    addaddress.addEventListener('click',(e)=>{
      e.preventDefault()
      window.location.href = '/account/addAddress'
    })
  }
  
  function attachAddressEvents(){
    document.querySelectorAll('.btn-edit').forEach(btn=>{
      btn.addEventListener('click',async(e)=>{
        const addressId = e.currentTarget.dataset.id
        window.location.href = `/address/edit/${addressId}`
      })
    })

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click',async(e)=>{
        const addressId=e.currentTarget.dataset.id

        const result=await Swal.fire({
          title: 'Are you sure?',
          text: 'This will permanently delete the address.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, delete it!',
          cancelButtonText: 'Cancel'
        })

        if (result.isConfirmed) {
          try {
            const response=await fetch(`/address/delete/${addressId}`, { method: "DELETE" })

            if (response.ok){
              Swal.fire({
                title: 'Deleted!',
                text: 'Address has been deleted.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              })
              const addressContainer = document.querySelector('#address-list')
              const updatedList = await fetch('/address/list')
              addressContainer.innerHTML = await updatedList.text()
              attachAddressEvents()

            } else {
              Swal.fire({ title: 'Error!', text: 'Failed to delete address.', icon: 'error' })
            }
          } catch (error) {
            console.log(error)
            Swal.fire('Error', 'Something went wrong', 'error')
          }
        }
      })
    })
  }
  attachAddressEvents()
})