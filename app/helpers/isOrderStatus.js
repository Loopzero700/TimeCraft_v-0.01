const Order = require('../../app/models/orderSchema')

const checkAndUpdateOrderStatus = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
    if (!order) return
    const itemStatuses = order.items.map(item => item.item_status)

    const allCancelled = itemStatuses.length > 0 && itemStatuses.every(status => status === "Cancelled")
    const allReturned = itemStatuses.length > 0 && itemStatuses.every(status => status === "Returned")

    if (allCancelled) {
      order.status = "Cancelled"
      order.order_cancel_reason = "All items were cancelled"
      order.cancelled_at = new Date()
    } else if (allReturned) {
      order.status = "Returned"
      order.order_return_reason = "All items were returned"
      order.returned_at = new Date()
    }

    if (allCancelled || allReturned) {
      await order.save()
    }

  } catch (err) {
    console.error(`Error updating order status for ID: ${orderId}`, err)
  }
}

module.exports = {
  checkAndUpdateOrderStatus
}
