 document.getElementById('addCategoryForm').addEventListener('submit', handleFormSubmit)

    function handleFormSubmit(e) {
       
        e.preventDefault()

        if (!validateForm()) {
            return;
        }

        const name = document.getElementById("categoryName").value
        const description = document.getElementById("categoryDescription").value

        fetch('/admin/category', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        })
        .then(response => {
            if (!response.ok) {
               
                return response.json().then(err => {
                    throw new Error(err.error || 'An unknown error occurred.')
                })
            }
            return response.json()
        })
        .then(data => {
            
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Category added successfully.',
                timer: 1500, 
                showConfirmButton: false
            }).then(() => {
                 window.location.replace('/admin/category')
            });
        })
        .catch(error => {
           
            if (error.message === "Category already exists") {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "A category with this name already exists!"
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "An error occurred while adding the category."
                })
            }
        })
    }

    const validateForm = () => {
        clearErrorMessages()
        const name = document.getElementById("categoryName").value.trim()
        const description = document.getElementById("categoryDescription").value.trim()
        
        let isValid = true
        
        if (name === "") {
            displayErrorMessage("name-error", "Please enter a category name.")
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            displayErrorMessage("name-error", "Category name should only contain letters and spaces.")
            isValid = false;
        }

        if (description === "") {
            displayErrorMessage("description-error", "Please enter a description.")
            isValid = false
        }
        
        return isValid
    }

    const displayErrorMessage = (elementId, message) => {
        const errorElement = document.getElementById(elementId)
        if (errorElement) {
            errorElement.innerText = message
            errorElement.style.display = "block"
        }
    }

    const clearErrorMessages = () => {
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