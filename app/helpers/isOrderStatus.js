const Order = require('../../app/models/orderSchema')

const checkAndUpdateOrderStatus = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
    if (!order) return

    const itemStatuses = order.items.map(item => item.item_status)
      
    if (itemStatuses.length === 0) return
  
    const allCancelled = itemStatuses.every(status => status === "Cancelled")

    const allReturnedOrCancelled = itemStatuses.every(status => 
      status === "Return-Approved" || status === "Cancelled"
    )   
  
    const hasAtLeastOneReturned = itemStatuses.some(status => status === "Return-Approved")

    let needsSave = false

    if (allCancelled) {
      order.status = "Cancelled"
      order.order_cancel_reason = "All items were cancelled";
      order.cancelled_at = new Date()
      needsSave = true

    } else if (allReturnedOrCancelled && hasAtLeastOneReturned) {
      order.status = "Returned"
      order.order_return_reason = "All items were returned or cancelled"
      order.returned_at = new Date()
      needsSave = true
    }

    if (needsSave) {
      await order.save()
    }

  } catch (err) {
    console.error(`Error updating order status for ID: ${orderId}`, err)
  }
}

module.exports = {
  checkAndUpdateOrderStatus
}