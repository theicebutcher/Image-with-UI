let savedImages = []; // Initialize as an empty array
let modal = document.getElementById("imageModal");
let canvas = document.getElementById("drawingCanvas");
let ctx = canvas.getContext("2d");
let currentImageURL = null;
let isPainting = false;
let lineWidth = 10;
let startX, startY;


// Initialize canvas with proper dimensions
function resizeCanvas() {
    const container = modal.querySelector('.modal-content');
    // Reduce the subtracted values to make canvas larger
    canvas.width = container.offsetWidth - 20;  // Was -40
    canvas.height = container.offsetHeight - 80;  // Was -150

    if (currentImageURL) {
        redrawImage();
    }
}
// Redraw image onto canvas
// Redraw image onto canvas
function redrawImage() {
    if (currentImageURL) {
        let img = new Image();
        img.onload = function () {
            // Set canvas dimensions to match the image
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear and redraw the image at full size
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Optional: Adjust modal size to fit the canvas
            adjustModalToCanvas();
        };
        img.src = currentImageURL;
    }
}

// Optional: Resize modal to fit the canvas (or enable scrolling)
function adjustModalToCanvas() {
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.width = 'auto';
    modalContent.style.height = 'auto';
    modalContent.style.overflow = 'auto'; // Enable scrolling if needed
}
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startPosition(e) {
    isPainting = true;
    const pos = getCanvasCoordinates(e);
    startX = pos.x;
    startY = pos.y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
}

function draw(e) {
    if (!isPainting) return;

    const pos = getCanvasCoordinates(e);

    // Save the current context state
    ctx.save();

    // Apply current styles
    ctx.strokeStyle = document.getElementById('stroke').value; // Get current color
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Restore the context state (optional)
    ctx.restore();
}
function endPosition() {
    isPainting = false;
    ctx.beginPath();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentImageURL) {
        redrawImage();
    }
}
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();  // Optional: prevents form submission if inside a form
        sendMessage();           // Trigger sendMessage() on Enter key press
    }
});
function updateInputFiles() {
    const imageUpload = document.getElementById("image-upload");
    const dataTransfer = new DataTransfer();

    // Add all files from our global array to the DataTransfer
    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });

    // Update the input's files
    imageUpload.files = dataTransfer.files;
}
let selectedFiles = [];

function previewImage() {
    const imageUpload = document.getElementById("image-upload");
    const previewContainer = document.getElementById("image-preview-container");
    const inputWrapper = document.querySelector(".input-wrapper");

    // Add newly selected files to our global array, avoiding duplicates
    if (imageUpload.files && imageUpload.files.length > 0) {
        Array.from(imageUpload.files).forEach(file => {
            const fileExists = selectedFiles.some(
                existingFile => existingFile.name === file.name &&
                    existingFile.size === file.size &&
                    existingFile.lastModified === file.lastModified
            );

            if (!fileExists) {
                selectedFiles.push(file);
            }
        });
    }

    // Clear and rebuild preview with all selected files
    previewContainer.innerHTML = "";

    if (selectedFiles.length > 0) {
        // Increase wrapper height when images are present
        inputWrapper.style.minHeight = "90px";
        
        selectedFiles.forEach((file, index) => {
            const previewWrapper = document.createElement("div");
            previewWrapper.className = "preview-wrapper";
            previewWrapper.style.position = "relative";
            
            const imgPreview = document.createElement("img");
            imgPreview.classList.add("preview-image");

            const removeBtn = document.createElement("span");
            removeBtn.innerHTML = "&times;";
            removeBtn.className = "preview-remove";
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeImage(index);
            };

            const reader = new FileReader();
            reader.onload = function(e) {
                imgPreview.src = e.target.result;
                imgPreview.title = file.name;
                
                // Show larger preview on click
                imgPreview.onclick = (e) => {
                    e.stopPropagation();
                    showFullImagePreview(e.target.src);
                };
            };
            reader.readAsDataURL(file);

            previewWrapper.appendChild(imgPreview);
            previewWrapper.appendChild(removeBtn);
            previewContainer.appendChild(previewWrapper);
        });
    } else {
        // Reset wrapper height when no images
        inputWrapper.style.minHeight = "50px";
    }

    updateInputFiles();
    checkInput();
}

// Helper function to show full image preview
function showFullImagePreview(src) {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.8)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";
    modal.onclick = () => document.body.removeChild(modal);
    
    const img = document.createElement("img");
    img.src = src;
    img.style.maxHeight = "100%";
    img.style.maxWidth = "100%";
    img.style.objectFit = "contain";
    
    modal.appendChild(img);
    document.body.appendChild(modal);
}
function removeImage(index) {
    // Remove the file from our global array
    selectedFiles.splice(index, 1);

    // Update the input files to reflect the change
    updateInputFiles();

    // Rebuild preview with remaining images
    previewImage();
    checkInput()
}

function toggleChatbot() {
    var chatbot = document.getElementById("chatbot-container");
    var button = document.getElementById("chatbot-button");

    if (chatbot.style.display === "none" || !chatbot.style.display) {
        chatbot.style.display = "flex";
        button.style.display = "none";
    } else {
        chatbot.style.display = "none";
        button.style.display = "none";
        button.style.display = "flex";
    }
}

function formatResponse(rawResponse) {
    // Precise Image URL detection (Cloudinary and common formats)
    const imageRegex = /!\[(.*?)\]\((https?:\/\/(?:res\.cloudinary\.com|[a-zA-Z0-9.-]+)\S*?\.(?:jpg|jpeg|png|gif|webp)(?:\?\S*)?)\)/gi;

    // Convert Markdown image syntax ![alt text](URL) to an <img> tag
    rawResponse = rawResponse.replace(imageRegex, (match, altText, imageUrl) => {
        return `<div style="text-align: center; margin-top: 20px;">
        <img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transition: transform 0.3s ease, box-shadow 0.3s ease;">
    </div>`;
    });

    // Bold text: **text**
    rawResponse = rawResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic text: *text* (only if NOT part of an image)
    rawResponse = rawResponse.replace(/(?<!\!)\*(.*?)\*/g, '<em>$1</em>');

    // Italicize text inside square brackets: [text] → <em>text</em>
    rawResponse = rawResponse.replace(/\[(.*?)\]/g, '<em>$1</em>');

    // Headers: # text, ## text, etc.
    rawResponse = rawResponse.replace(/^(#{1,6})\s*(.*?)$/gm, (match, hashes, headerText) => {
        const level = hashes.length;
        return `<h${level}>${headerText}</h${level}>`;
    });

    // Code blocks: ```code```
    rawResponse = rawResponse.replace(/```(.*?)```/gs, '<pre>$1</pre>');

    // Inline code: `code`
    rawResponse = rawResponse.replace(/`(.*?)`/g, '<code>$1</code>');

    // Convert other URLs to clickable links (excluding images)
    rawResponse = rawResponse.replace(/(https?:\/\/[^\s<>")]+)/g, (match) => {
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(match)) {
            return `<a href="${match}" target="_blank">${match}</a>`;
        }
        return match;
    });

    return rawResponse;
}

// Function to simulate saving images to a "selected images" folder (client-side only)
function saveImagesLocally(files) {
    return new Promise((resolve, reject) => {
        const savedFiles = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Simulating saving: just creating a temporary URL for demonstration
            const blob = new Blob([file], { type: file.type });
            const url = URL.createObjectURL(blob);
            savedFiles.push({ name: file.name, url }); // Store name and temp URL
        }
        resolve(savedFiles);
    });
}

// Function to delete "saved" images (revoke temporary URLs)
function deleteSavedImages(savedImages) {
    savedImages.forEach(image => {
        URL.revokeObjectURL(image.url);
    });
}
function clearSelectedFiles() {
    console.log("Clearing selected files...");
    console.log("Before clear - selectedFiles:", selectedFiles.length);

    selectedFiles = [];
    document.getElementById("image-upload").value = "";
    document.getElementById("image-preview-container").innerHTML = "";

    console.log("After clear - selectedFiles:", selectedFiles.length);
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.style.display = "flex";
    typingDiv.style.alignItems = "flex-start";
    typingDiv.style.gap = "15px";
    typingDiv.style.marginBottom = "15px";
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'icon';
    iconSpan.style.display = "none";
    iconSpan.style.alignItems = "flex-start";
    iconSpan.style.flexShrink = "0";
    
    const iconImg = document.createElement('img');
    iconImg.src = 'static/icons/intelligence.png';
    iconImg.alt = 'Bot Icon';
    iconImg.style.width = '40px';
    iconImg.style.height = '40px';
    iconImg.style.objectFit = "contain";

    
    iconSpan.appendChild(iconImg);
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    typingContent.style.padding = "12px 15px";
    typingContent.style.background = "fff";
    typingContent.style.borderRadius = "18px";
    typingContent.style.maxWidth = "80%";
    typingContent.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    
    typingDiv.appendChild(iconSpan);
    typingDiv.appendChild(typingContent);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv;
}
  
  function removeTypingIndicator(typingElement) {
    if (typingElement && typingElement.parentNode) {
      typingElement.parentNode.removeChild(typingElement);
    }
  }
  // Add these helper functions to your JavaScript

  
  function removeTypingIndicator(typingElement) {
    if (typingElement && typingElement.parentNode) {
      typingElement.parentNode.removeChild(typingElement);
    }
  }

  document.getElementById('user-input').addEventListener('input', function() {
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = this.value.trim() === '' || isLoadingResponse;
});

// Get the input field and send button elements
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');

// Function to check input and enable/disable send button
function checkInput() {
    // Enable if either there's text OR files are selected
    sendButton.disabled = !(userInput.value.trim() !== '' || selectedFiles.length > 0);
}

// Add event listeners
userInput.addEventListener('input', checkInput);
userInput.addEventListener('paste', checkInput);


// Also call checkInput when files are selected (you'll need to modify your file selection logic)
// For example, in your previewImage() function, add a call to checkInput()
  
  async function sendMessage() {
    
    const quickPrompts = document.querySelector('.quick-prompts');
    if (quickPrompts) {
        quickPrompts.style.display = 'none';
    }
    const heading = document.getElementById('chat-welcome-heading');
    if (heading && !heading.classList.contains('hidden')) {
        heading.classList.add('hidden');
    }
    var userInput = document.getElementById('user-input').value;
    var chatMessages = document.getElementById('chat-messages');

    // Check for empty user input and images
    if (userInput.trim() === '' && selectedFiles.length === 0) {
        return;
    }

    

    // Display user's message
    var userMessageDiv = document.createElement("div");
    userMessageDiv.classList.add("message", "user-message");
    userMessageDiv.style.display = "flex";
    userMessageDiv.style.alignItems = "flex-start";
    userMessageDiv.style.gap = "15px";
    userMessageDiv.style.marginBottom = "15px";

    var userIcon = document.createElement("span");
    userIcon.classList.add("icon");
    userIcon.style.display = "none";
    userIcon.style.alignItems = "flex-start";
    userIcon.style.flexShrink = "0";

    var userImg = document.createElement("img");
    userImg.src = "static/icons/user.png";
    userImg.alt = "User Icon";
    userImg.style.width = "40px";
    userImg.style.height = "40px";
    userImg.style.objectFit = "contain";
    

    userIcon.appendChild(userImg);

    var userMessageText = document.createElement("div");
    userMessageText.classList.add("message-text");
    userMessageText.textContent = userInput;
    userMessageText.style.padding = "12px 15px";
    userMessageText.style.background = "#Fff";
    userMessageText.style.color = "black";
    userMessageText.style.borderRadius = "18px";
    userMessageText.style.maxWidth = "80%";

    userMessageDiv.appendChild(userIcon);
    userMessageDiv.appendChild(userMessageText);

    // Display uploaded images (if any)
    if (selectedFiles.length > 0) {
        const previewContainer = document.createElement("div");
        previewContainer.style.display = "flex";
        previewContainer.style.flexWrap = "wrap";
        previewContainer.style.gap = "5px";
        previewContainer.style.marginTop = "10px";

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            var userImage = document.createElement("img");
            userImage.classList.add("chat-image");
            userImage.style.maxWidth = "70px";
            userImage.style.maxHeight = "70px";
            userImage.style.objectFit = "cover";

            var reader = new FileReader();
            reader.onload = (function (img) {
                return function (e) {
                    img.src = e.target.result;
                };
            })(userImage);

            reader.readAsDataURL(file);
            previewContainer.appendChild(userImage);
        }
        userMessageText.appendChild(previewContainer);
    }

    chatMessages.appendChild(userMessageDiv);

    // Show typing indicator
    const typingElement = showTypingIndicator();

    // Prepare form data
    var formData = new FormData();
    formData.append("user_input", userInput);

    // Add images to form data if they exist
    if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("images", selectedFiles[i]);
        }
    }

    try {
        const response = await fetch("/chatbot", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator(typingElement);

        // Create bot message container
        var botMessageDiv = document.createElement("div");
        botMessageDiv.classList.add("message", "bot-message");
        botMessageDiv.style.display = "flex";
        botMessageDiv.style.alignItems = "flex-start";
        botMessageDiv.style.gap = "15px";
        botMessageDiv.style.marginBottom = "15px";
        

        var botIcon = document.createElement("span");
        botIcon.classList.add("icon");
        botIcon.style.display = "none";
        botIcon.style.alignItems = "flex-start";
        botIcon.style.flexShrink = "0";

        var botImg = document.createElement("img");
        botImg.src = "static/icons/intelligence.png";
        botImg.alt = "Bot Icon";
        botImg.style.width = "40px";
        botImg.style.height = "40px";
        botImg.style.objectFit = "contain";
    

        botIcon.appendChild(botImg);

        var botMessageText = document.createElement("div");
        botMessageText.classList.add("message-text");
        botMessageText.style.padding = "12px 15px";
        botMessageText.style.background = "#ECECEC";
        botMessageText.style.borderRadius = "18px";
        botMessageText.style.maxWidth = "80%";

        // Handle different response types
        if (data.response.includes("https://theicebutcher.com/request/")) {
            // Handle order link case
            var link = document.createElement("a");
            link.href = "https://theicebutcher.com/request/";
            link.target = "_blank";

            var img = document.createElement("img");
            img.src = "/static/img.PNG";
            img.classList.add("chat-image");
            img.style.borderRadius = "12px";
            img.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            img.style.transition = "transform 0.2s ease-in-out";

            link.appendChild(img);
            botMessageText.appendChild(link);
        } else {
            // Show regular text response
            const formattedResponse = formatResponse(data.response);
            botMessageText.innerHTML = formattedResponse || "Sorry, I couldn't understand your request.";
        }

        // Display reference images if present
        if (data.reference_images && data.reference_images.length > 0) {
            const imageContainer = document.createElement("div");
            imageContainer.style.display = "flex";
            imageContainer.style.flexWrap = "wrap";
            imageContainer.style.gap = "10px";
            imageContainer.style.marginTop = "10px";

            data.reference_images.forEach(imageUrl => {
                const refImage = document.createElement("img");
                refImage.src = imageUrl;
                refImage.classList.add("chat-image");
                refImage.style.cursor = "pointer";

                refImage.onclick = function () {
                    document.getElementById("user-input").value = `Generate a Double Luge sculpture based on this reference image: ${imageUrl}`;
                    sendMessage();
                };

                imageContainer.appendChild(refImage);
            });

            botMessageText.appendChild(imageContainer);
        }

        // Handle image generation response
// ... (previous code remains the same until the image generation response section)

     // ... (previous code remains the same until the image generation response section)

        // Handle image generation response
        if (data.image_url) {
            const timestamp = new Date().getTime();
            const randomNum = Math.floor(Math.random() * 1000);
            const uniqueFilename = `generated_image_${timestamp}_${randomNum}.png`;

            // Create main container for image and actions
            const container = document.createElement("div");
            container.style.position = "relative"; // For absolute positioning of icons
            container.style.display = "inline-block";
            container.style.maxWidth = "100%";
            botMessageText.style.padding = "12px 15px";
            botMessageText.style.background = "#fff";
            botMessageText.style.borderRadius = "18px";

            // Create image element
            var img = document.createElement("img");
            img.src = data.image_url;
            img.classList.add("chat-image");
            img.alt = `Generated Image ${timestamp}`;
        
            img.style.borderRadius = "10px";
            img.style.display = "block"; // Ensure image is block-level

            img.onclick = function () {
                openModal(data.image_url);
            };

            // Create action icons container (positioned below image)
            const actionsContainer = document.createElement("div");
            actionsContainer.style.display = "flex";
            actionsContainer.style.gap = "10px";
            actionsContainer.style.marginTop = "5px";
            actionsContainer.style.alignItems = "center";
            

            // Download icon
            const downloadIcon = document.createElement("img");
            downloadIcon.src = "static/icons/download.png";
            downloadIcon.style.width = "24px";
            downloadIcon.style.height = "24px";
            downloadIcon.style.cursor = "pointer";
            downloadIcon.style.opacity = "0.7";
            downloadIcon.title = "Download image";
            
            downloadIcon.onmouseenter = function() {
                this.style.opacity = "1";
            };
            downloadIcon.onmouseleave = function() {
                this.style.opacity = "0.7";
            };
            
            downloadIcon.onclick = function() {
                const link = document.createElement("a");
                link.href = data.image_url;
                link.download = uniqueFilename;
                link.click();
            };

            // Select icon
            const selectIcon = document.createElement("img");
            selectIcon.src = "static/icons/select.png";
            selectIcon.style.width = "24px";
            selectIcon.style.height = "24px";
            selectIcon.style.cursor = "pointer";
            selectIcon.style.opacity = "0.7";
            selectIcon.title = "Select image";
            
            selectIcon.onmouseenter = function() {
                this.style.opacity = "1";
            };
            selectIcon.onmouseleave = function() {
                this.style.opacity = "0.7";
            };
            
            selectIcon.onclick = function() {
                fetch(data.image_url)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], uniqueFilename, { type: "image/png" });
                        selectedFiles = [file];
                        updateInputFiles();
                        previewImage();
                    });
            };
            const expandIcon = document.createElement("img");
                expandIcon.src = "static/icons/editing.png"; // You need this icon file
                expandIcon.style.width = "24px";
                expandIcon.style.height = "24px";
                expandIcon.style.cursor = "pointer";
                expandIcon.style.opacity = "0.7";
                expandIcon.title = "View larger";

                expandIcon.onmouseenter = function() { this.style.opacity = "1"; };
                expandIcon.onmouseleave = function() { this.style.opacity = "0.7"; };

                expandIcon.onclick = function(e) {
                    e.stopPropagation();
                    openModal(data.image_url); // Only opens modal, no other actions
                };

            // Add icons to actions container
            actionsContainer.appendChild(downloadIcon);
            actionsContainer.appendChild(selectIcon);
            actionsContainer.appendChild(expandIcon);

            // Add image and actions to main container
            container.appendChild(img);
            container.appendChild(actionsContainer);

            botMessageText.appendChild(container);

            // Add feedback modal trigger
            openInlineFeedback(data.image_url);
        }

// ... (rest of the code remains the same)
// ... (rest of the code remains the same)

        // Complete bot message assembly
        botMessageDiv.appendChild(botIcon);
        botMessageDiv.appendChild(botMessageText);
        chatMessages.appendChild(botMessageDiv);

    } catch (error) {
        // Remove typing indicator on error
        removeTypingIndicator(typingElement);
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message';
        errorDiv.style.display = "flex";
        errorDiv.style.alignItems = "flex-start";
        errorDiv.style.gap = "15px";
        
        const errorIcon = document.createElement("span");
        errorIcon.className = "icon";
        errorIcon.style.display = "flex";
        errorIcon.style.alignItems = "flex-start";
        errorIcon.style.flexShrink = "0";
        
        const errorImg = document.createElement("img");
        errorImg.src = "static/icons/intelligence.png";
        errorImg.alt = "Bot Icon";
        errorImg.style.width = "40px";
        errorImg.style.height = "40px";
        errorImg.style.objectFit = "contain";
        
        errorIcon.appendChild(errorImg);
        
        const errorText = document.createElement("div");
        errorText.className = "message-text";
        errorText.style.padding = "12px 15px";
        errorText.style.background = "#fff";
        errorText.style.borderRadius = "18px";
        errorText.style.maxWidth = "80%";
        errorText.textContent = "Sorry, there was an error processing your request.";
        
        errorDiv.appendChild(errorIcon);
        errorDiv.appendChild(errorText);
        chatMessages.appendChild(errorDiv);
        
        console.error("Error:", error);
    } finally {
        // Clear the text input and image previews
        document.getElementById("user-input").value = "";
        clearSelectedFiles();
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }






    
}
// Event listeners for drawing
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mouseout', endPosition);

// Toolbar event listeners
document.getElementById('stroke').addEventListener('change', (e) => {
    ctx.strokeStyle = e.target.value;
});

document.getElementById('lineWidth').addEventListener('change', (e) => {
    lineWidth = e.target.value;
});

document.getElementById('clearDrawingBtn').addEventListener('click', clearCanvas);

// Window resize handler
window.addEventListener('resize', () => {
    if (modal.style.display === 'block') {
        resizeCanvas();
    }
});

// Update the openModal function
function openModal(imageURL) {
    modal.style.display = "block";
    currentImageURL = imageURL;

    setTimeout(() => {
        resizeCanvas();

        // Set initial drawing styles using the input's value
        ctx.strokeStyle = document.getElementById('stroke').value; // Use input's value
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, 10);
}

function closeModal() {
    modal.style.display = "none";
    currentImageURL = null;
    clearCanvas();  // Clear the canvas when closing
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentImageURL) {
        let img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentImageURL;
    }

}

function confirmDrawing() {
    // Convert the canvas content to a data URL (image)
    const drawnImage = canvas.toDataURL("image/png");

    // You now have the drawn image as a base64 string (`drawnImage`)
    // You can send this back to your server or perform other actions
    console.log("Drawn Image Data:", drawnImage);

    // Here, simulate adding the drawn image to the existing images
    // Convert data URL to blob
    fetch(drawnImage)
        .then(res => res.blob())
        .then(blob => {
            // Create a File object
            const newFile = new File([blob], 'drawn_image.png', { type: 'image/png' });

            // Add the new file to the selectedFiles array
            selectedFiles.push(newFile);

            // Update the input files
            updateInputFiles();

            // Rebuild the preview to include the new image
            previewImage();
        });
    //close the modal
    closeModal();
}
function updateInputFiles() {
    const imageUpload = document.getElementById("image-upload");
    const dataTransfer = new DataTransfer();

    // Add all files from our global array to the DataTransfer
    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });

    // Update the input's files
    imageUpload.files = dataTransfer.files;
}
function removeImage(index) {
    // Remove the file from our global array
    selectedFiles.splice(index, 1);

    // Update the input files to reflect the change
    updateInputFiles();

    // Rebuild preview with remaining images
    previewImage();
}
function clearSelectedFiles() {
    console.log("Starting clear...");
    console.log("selectedFiles before:", selectedFiles.length);

    selectedFiles = [];

    const imageUpload = document.getElementById("image-upload");
    console.log("input value before:", imageUpload.value);
    imageUpload.value = "";

    console.log("Clearing preview...");
    document.getElementById("image-preview-container").innerHTML = "";

    if (imageUpload.files) {
        console.log("Clearing DataTransfer...");
        const dataTransfer = new DataTransfer();
        imageUpload.files = dataTransfer.files;
    }

    console.log("Clear complete");
    console.log("selectedFiles after:", selectedFiles.length);
    console.log("input value after:", imageUpload.value);
}
let recognition;
let isListening = false;

function startVoiceInput() {
    const micBtn = document.getElementById("mic-btn");

    if (!recognition) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false; // Stop after one sentence
        recognition.interimResults = false; // Only final results
        recognition.lang = "en-US"; // Set language

        recognition.onstart = function () {
            isListening = true;
            micBtn.classList.add("active");
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById("user-input").value = transcript;
            isListening = false;
            micBtn.classList.remove("active");

            // Automatically send the message
            sendMessage();
        };

        recognition.onerror = function (event) {
            console.error("Speech recognition error:", event.error);
            isListening = false;
            micBtn.classList.remove("active");
        };

        recognition.onend = function () {
            isListening = false;
            micBtn.classList.remove("active");
        };
    }

    if (isListening) {
        recognition.stop();
        isListening = false;
        micBtn.classList.remove("active");
    } else {
        recognition.start();
    }
}



// Add these functions to your existing script.js or in a script tag within the HTML
function startSculptureFlow() {
    // Hide the initial prompt button
    let startPromptButton = document.getElementById('start-prompt-button');
    if (startPromptButton) {
        startPromptButton.style.display = 'none';
    }

    // Display sculpture type selection buttons
    displaySculptureTypeButtons();
}

function displaySculptureTypeButtons() {
    const chatMessages = document.getElementById('chat-messages');
    // Create a container for the buttons
    // Clear any existing button container
    const existingContainer = document.getElementById('sculpture-buttons-container');
    if (existingContainer) {
        chatMessages.removeChild(existingContainer);
    }

    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'sculpture-buttons-container';
    buttonContainer.style.position = 'sticky';
    buttonContainer.style.bottom = '0';
    buttonContainer.style.backgroundColor = '#fff';
    buttonContainer.style.padding = '10px';
    buttonContainer.style.borderTop = '1px solid #eee';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.zIndex = '100';

    // Define the sculpture types
    const sculptureTypes = [
        { label: 'Luge', value: 'luge' },
        { label: 'Seafood Display', value: 'seafood_display' },
        { label: 'Showpieces', value: 'showpieces' },
        { label: 'Ice Bar', value: 'ice_bar' },
        { label: 'Ice Cubes', value: 'ice_cubes' }
    ];

    // Create and append the buttons
    sculptureTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type.label;
        button.onclick = () => handleSculptureTypeSelection(type.value);
        buttonContainer.appendChild(button);
    });

    // Add back button
    const backButton = createBackButton("<");
    backButton.onclick = () => resetSculptureButtons();
    buttonContainer.appendChild(backButton);

    // Append the button container to the chat messages
    chatMessages.appendChild(buttonContainer);
}


function handleSculptureTypeSelection(type) {
    // Clear existing buttons
    const chatMessages = document.getElementById('chat-messages');
    const buttonContainer = document.getElementById('sculpture-buttons-container');
    if (buttonContainer) {
        chatMessages.removeChild(buttonContainer);
    }

    // Save the sculpture type
    currentSculptureType = type;

    // For luge, show luge types first
    if (type === 'luge') {
        displayLugeTypeButtons();
    } else {
        // For other types, show themes directly
        displayThemeButtons();
    }
}


let currentSculptureType = null;
let currentLugeType = null;
function displayThemeButtons() {
    const chatMessages = document.getElementById('chat-messages');

    // Clear existing container
    const existingContainer = document.getElementById('sculpture-buttons-container');
    if (existingContainer) {
        chatMessages.removeChild(existingContainer);
    }

    // Create new container with bottom styling
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'sculpture-buttons-container';
    buttonContainer.style.position = 'sticky';
    buttonContainer.style.bottom = '0';
    buttonContainer.style.backgroundColor = '#fff';
    buttonContainer.style.padding = '10px';
    buttonContainer.style.borderTop = '1px solid #eee';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.zIndex = '100';

    // Define the themes
    const themes = ['Dragon', 'Bunny', 'Birthday', 'Holiday', 'Country Club', 'No Theme'];

    // Create and append the buttons
    themes.forEach(theme => {
        const button = document.createElement('button');
        button.textContent = theme;
        button.onclick = () => {
            let prompt;

            if (currentSculptureType === 'luge') {
                // For luge, use the stored luge type
                prompt = `I want a ${currentLugeType.replace('_', ' ')}`;
                if (theme !== 'No Theme') {
                    prompt += ` for ${theme} theme`;
                }
                prompt += `.`;
            } else {
                // For other sculpture types
                prompt = `I want a`;
                if (theme !== 'No Theme') {
                    prompt += ` ${theme} themed`;
                }
                prompt += ` ${currentSculptureType.replace('_', ' ')} sculpture.`;
            }

            sendPredefinedPrompt(prompt);
        };
        buttonContainer.appendChild(button);
    });

    // Add back button
    const backButton = createBackButton("<");
    backButton.onclick = () => {
        if (currentSculptureType === 'luge') {
            displayLugeTypeButtons(); // Go back to luge type selection
        } else {
            displaySculptureTypeButtons(); // Go back to sculpture type selection
        }
    };
    buttonContainer.appendChild(backButton);

    // Append the button container to the chat messages
    chatMessages.appendChild(buttonContainer);
}

function displayLugeTypeButtons() {
    const chatMessages = document.getElementById('chat-messages');

    // Clear existing buttons
    const buttonContainer = document.getElementById('sculpture-buttons-container');
    if (buttonContainer) {
        chatMessages.removeChild(buttonContainer);
    }

    // Create a container for the luge type buttons
    const lugeButtonContainer = document.createElement('div');
    lugeButtonContainer.id = 'sculpture-buttons-container';
    lugeButtonContainer.style.position = 'sticky';
    lugeButtonContainer.style.bottom = '0';
    lugeButtonContainer.style.backgroundColor = '#fff';
    lugeButtonContainer.style.padding = '10px';
    lugeButtonContainer.style.borderTop = '1px solid #eee';
    lugeButtonContainer.style.display = 'flex';
    lugeButtonContainer.style.flexWrap = 'wrap';
    lugeButtonContainer.style.gap = '8px';
    lugeButtonContainer.style.zIndex = '100';

    // Define the luge types
    const lugeTypes = [
        { label: 'Martini Luge', value: 'martini_luge' },
        { label: 'Double Luge', value: 'double_luge' },
        { label: 'Tube Luge', value: 'tube_luge' }
    ];

    // Create and append the luge type buttons
    lugeTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type.label;
        button.onclick = () => {
            currentLugeType = type.value; // Store selected luge type
            displayThemeButtons(); // Then show theme options
        };
        lugeButtonContainer.appendChild(button);
    });

    // Add back button
    const backButton = createBackButton("<");
    backButton.onclick = () => {
        displaySculptureTypeButtons(); // Go back to sculpture type selection
    };
    lugeButtonContainer.appendChild(backButton);

    // Append the luge type button container to the chat messages
    chatMessages.appendChild(lugeButtonContainer);
}

function sendPredefinedPrompt(prompt) {
    // Send the predefined prompt to the chat
    document.getElementById('user-input').value = prompt;
    sendMessage();
}

function resetSculptureButtons() {
    const chatMessages = document.getElementById('chat-messages');

    // Find and remove the button container, if it exists
    const buttonContainer = document.getElementById('sculpture-buttons-container');
    if (buttonContainer) {
        chatMessages.removeChild(buttonContainer);
    }

    // Find the start prompt button
    let startPromptButton = document.getElementById('start-prompt-button');

    if (!startPromptButton) {
        // If it doesn't exist, create it
        startPromptButton = document.createElement('button');
        startPromptButton.id = 'start-prompt-button';
        startPromptButton.textContent = "Let's start making a sculpture of your choice!";
        startPromptButton.onclick = startSculptureFlow;
        chatMessages.appendChild(startPromptButton);
    }

    // Ensure it's visible
    startPromptButton.style.display = '';
}

function createBackButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.backgroundColor = 'transparent';
    button.style.color = 'white';
    button.style.padding = '6px 12px';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '0.9em';
    button.style.marginLeft = 'auto'; // Pushes to right
    button.style.transition = 'all 0.2s ease';

    button.onmouseover = function () {
        this.style.backgroundColor = '#f0f4f8';
    };
    button.onmouseout = function () {
        this.style.backgroundColor = 'transparent';
    };

    return button;
}


//Close the modal
let closeBtn = document.querySelector(".close");
closeBtn.onclick = function () {
    closeModal();
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
};

// Drawing functionality

// Clear canvas button
document.getElementById('clearDrawingBtn').addEventListener('click', clearCanvas);

// Confirm drawing button
document.getElementById('confirmDrawingBtn').addEventListener('click', confirmDrawing);

// Call resizeCanvas on window resize
window.addEventListener('resize', resizeCanvas);

// Replace all stroke color event listeners with this single one:
document.getElementById('stroke').addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value; // Update color in real-time
});
// Remove this if it exists in your code:
document.getElementById('stroke').addEventListener('change', (e) => {
    ctx.strokeStyle = e.target.value;
});

// Global variable to store the current image data for feedback
let currentFeedbackImageData = null;

// Open inline feedback section after image generation
function openInlineFeedback(imageURL) {
    currentFeedbackImageData = imageURL; // Store the image URL (will be converted to Base64 later)
    const feedbackSection = document.getElementById('inlineFeedback');
    feedbackSection.style.display = 'block';

    // Reset stars and comment
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('active');
        star.style.color = '#ccc';
    });
    document.getElementById('feedbackComment').value = '';

    // Star rating logic
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            stars.forEach(s => {
                s.classList.remove('active');
                s.style.color = parseInt(s.getAttribute('data-value')) <= value ? '#f1c40f' : '#ccc';
                if (parseInt(s.getAttribute('data-value')) <= value) {
                    s.classList.add('active');
                }
            });
        });
    });
}

// Close inline feedback section
function closeInlineFeedback() {
    const feedbackSection = document.getElementById('inlineFeedback');
    feedbackSection.style.display = 'none';
    currentFeedbackImageData = null;
}

// Handle feedback submission by sending data to server
function submitFeedback() {
    const stars = document.querySelectorAll('.star.active');
    const rating = stars.length;
    const comment = document.getElementById('feedbackComment').value;

    if (rating === 0) {
        alert('Please select a star rating before submitting.');
        return;
    }

    if (!currentFeedbackImageData) {
        alert('No image data available for feedback.');
        return;
    }

    // Prepare feedback data
    const feedbackData = {
        image_url: currentFeedbackImageData, // e.g., /static/uploads/sculpture_61be3d96.png
        rating: rating,
        comment: comment
    };

    console.log('Feedback data being sent:', feedbackData); // Debug log

    // Send feedback to server endpoint
    fetch('/submit_feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || `Server error! status: ${response.status}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Feedback submitted successfully:', data);
        closeInlineFeedback();
        alert('Thank you for your feedback!');
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        alert(`Error submitting feedback: ${error.message}. Please check the server logs or console for details.`);
    });
}

// Event listeners for inline feedback
document.getElementById('submitFeedbackBtn').addEventListener('click', submitFeedback);
document.querySelector('.close-feedback').addEventListener('click', closeInlineFeedback);







