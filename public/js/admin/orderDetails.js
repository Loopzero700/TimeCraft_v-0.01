document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Order Status Update Logic ---
    const updatePanel = document.getElementById('order-update-panel');
    const updateBtn = document.getElementById('btn-update-status');
    const statusSelect = document.getElementById('order-status-select');
    const statusDisplay = document.getElementById('current-status-display');

    // Only run if elements exist
    if (updatePanel && updateBtn) {
        
        // Read initial values from HTML data attributes
        let currentStatus = updatePanel.getAttribute('data-current-status');
        const orderId = updatePanel.getAttribute('data-order-id');

        const allowedStatusFlow = {
            "Pending": ["Shipped", "Out for Delivery", "Delivered", "Cancelled"],
            "Shipped": ["Out for Delivery", "Delivered"],
            "Out for Delivery": ["Delivered"],
            "Delivered": [],
            "Cancelled": [],
            "Returned": []
        };

        updateBtn.addEventListener('click', async () => {
            const newStatus = statusSelect.value;

            // Validate Status Flow
            if (allowedStatusFlow[currentStatus] && !allowedStatusFlow[currentStatus].includes(newStatus)) {
                return Swal.fire({
                    icon: "error",
                    title: "Invalid Status",
                    text: `You cannot change status from ${currentStatus} to ${newStatus}`,
                    confirmButtonColor: "#EF4444",
                });
            }

            try {
                const response = await fetch(`/admin/updateOrder/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    // Update Text
                    statusDisplay.textContent = newStatus;
                    
                    // Update Color Classes
                    statusDisplay.className = ''; // Clear old classes
                    let colorClass = 'text-blue-400 font-semibold'; // Default
                    if (newStatus === 'Delivered') colorClass = 'text-green-400 font-semibold';
                    else if (newStatus === 'Cancelled') colorClass = 'text-red-400 font-semibold';
                    else if (newStatus === 'Returned') colorClass = 'text-yellow-400 font-semibold';
                    statusDisplay.classList.add(...colorClass.split(' '));

                    // Update local variable
                    currentStatus = newStatus;
                    // Update the data attribute strictly for consistency
                    updatePanel.setAttribute('data-current-status', newStatus);

                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Order status updated successfully!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops!',
                        text: 'Failed to update order.',
                        confirmButtonColor: '#EF4444'
                    });
                }
            } catch (err) {
                console.error(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Something went wrong while updating order.',
                    confirmButtonColor: '#EF4444'
                });
            }
        });
    }

    // --- 2. Return Request Logic ---
    // These buttons already had data attributes in your original code, so they work easily here.
    const returnButtons = document.querySelectorAll('.return-action-btn');

    returnButtons.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            const orderId = e.currentTarget.dataset.orderId;
            const itemId = e.currentTarget.dataset.itemId;
            const action = e.currentTarget.dataset.action;
            const itemContainer = document.getElementById(itemId);

            try {
                const response = await fetch(`/admin/handleReturn/${orderId}/${itemId}`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: action })
                });

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Return status updated successfully!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Hide the return request box
                    if (itemContainer) {
                        itemContainer.style.display = "none";
                    }

                } else {
                    console.error('Request failed');
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to update return status'
                    });
                }
            } catch (err) {
                console.error('Error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Network error occurred'
                });
            }
        });
    });
});