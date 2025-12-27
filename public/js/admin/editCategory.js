 
    document.getElementById('editCategoryForm').addEventListener('submit', handleFormSubmit)
    function handleFormSubmit(e) {
        
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const form = e.target
        const categoryId = form.dataset.categoryId
        const url = `/admin/categories/edit/${categoryId}`
        const name = document.getElementById("categoryName").value
        const description = document.getElementById("categoryDescription").value

        
        fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        })
        .then(async response => {
            const res = await response.json()
            if (!response.ok) throw new Error(res.message || "Check your Internet")
            return res
        })
        .then(data => {
            
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Category updated successfully.',
                timer: 1500, 
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/admin/category'
            });
        })
        .catch(error => {
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: error.message || "An error occurred while updating the category."
            })
        })
    }

    function validateForm() {
        clearErrorMessages()
        const name = document.getElementById("categoryName").value.trim()
        const description = document.getElementById("categoryDescription").value.trim()
        
        let isValid = true 
        
        if (name === "") {
            displayErrorMessage("name-error", "Please enter a category name.")
            isValid = false
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            displayErrorMessage("name-error", "Category name should only contain letters and spaces.")
            isValid = false
        }

        if (description === "") {
            displayErrorMessage("description-error", "Please enter a description.")
            isValid = false
        }
        
        return isValid
    }

    function displayErrorMessage(elementId, message) {
        const errorElement = document.getElementById(elementId)
        if (errorElement) {
            errorElement.innerText = message
            errorElement.style.display = "block"
        }
    }

    function clearErrorMessages() {
        const errorElements = document.getElementsByClassName("error-message")
        Array.from(errorElements).forEach((element) => {
            element.innerText = ""
            element.style.display = "none"
        })
    }


     document.getElementById("categoryName").addEventListener("input", function () {
        if (this.value.trim() !== "" && /^[a-zA-Z\s]+$/.test(this.value.trim())) {
            document.getElementById("name-error").innerText = ""
            document.getElementById("name-error").style.display = "none"
        }
    })

    document.getElementById("categoryDescription").addEventListener("input", function () {
        if (this.value.trim() !== "") {
            document.getElementById("description-error").innerText = ""
            document.getElementById("description-error").style.display = "none"
        }
    })