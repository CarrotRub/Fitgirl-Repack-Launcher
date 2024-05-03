document.addEventListener("DOMContentLoaded", function() {
    const menuItems = document.querySelectorAll(".menu-item");
  
    // Function to remove active class from all menu items
    function removeActiveClass() {
      menuItems.forEach(item => {
        item.classList.remove("active-menu-item");
      });
    }
  
    // Event listener for menu item click
    menuItems.forEach(item => {
      item.addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default link behavior
        removeActiveClass(); // Remove active class from all menu items
        this.classList.add("active-menu-item"); // Add active class to clicked menu item
  
        // Store the selected menu item in localStorage
        localStorage.setItem("selectedMenuItem", this.href);
      });
    });
  
    // Check localStorage on page load and apply active class
    const selectedMenuItem = localStorage.getItem("selectedMenuItem");
    if (selectedMenuItem) {
      menuItems.forEach(item => {
        if (item.href === selectedMenuItem) {
          item.classList.add("active-menu-item");
        }
      });
    }
  });
  