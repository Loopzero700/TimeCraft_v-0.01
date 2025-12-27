const getAboutUs = (req, res) => {
  res.render("user/aboutUs", { layout: false })
}

export { getAboutUs }
