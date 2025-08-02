import os
import base64
from flask import Flask, render_template, request, jsonify, session
import openai
from dotenv import load_dotenv
import json
from flask_cors import CORS
import uuid
from PIL import Image
import io
import logging
import requests
import datetime
from flask import Flask, request, send_file, jsonify, render_template
from google import genai
from google.genai import types
import pathlib
from werkzeug.utils import secure_filename  # Add this import at the top
# Configure logging
logging.basicConfig(level=logging.DEBUG)


# Load FAQ data (unchanged)
with open('faq.json', 'r', encoding='utf-8') as file:
    faq_data = json.load(file)

app = Flask(__name__)
CORS(app)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "default-secret-key")  # Required for sessions
app.config["UPLOAD_FOLDER"] = "static/uploads"

# Load OpenAI API key
load_dotenv()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Helper function to encode images (unchanged)
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

def classify_prompt_type(prompt):
    classification_messages = [
        {
            "role": "system",
            "content": "You are a classification assistant. Based on the user's input, decide if they are asking for a sculpture to be generated, edit an image, or just get a text response. Reply with only one word: 'generate', 'edit', or 'text'."
        },
        {"role": "user", "content": prompt}
    ]
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=classification_messages
    )
    return response.choices[0].message.content.strip().lower()



def combine_images(image_paths, output_path):
    """Combines multiple images into one with a white background.
    Smaller images are resized to match the max height.
    Avoids combining duplicate images.
    """
    # First remove duplicates by checking file content
    unique_images = []
    seen_hashes = set()
    
    for path in image_paths:
        try:
            with Image.open(path) as img:
                # Create a hash of the image content
                img_hash = hash(img.tobytes())
                if img_hash not in seen_hashes:
                    seen_hashes.add(img_hash)
                    unique_images.append(path)
        except Exception as e:
            logging.warning(f"Could not process image {path}: {str(e)}")
            continue
    
    if not unique_images:
        raise ValueError("No valid images to combine")
    
    images = [Image.open(path) for path in unique_images]
    widths, heights = zip(*(i.size for i in images))

    max_height = max(heights)
    resized_images = []

    for img in images:
        width, height = img.size
        if height < max_height:
            # Maintain aspect ratio
            new_width = int((max_height / height) * width)
            img = img.resize((new_width, max_height), Image.LANCZOS)  # Updated from ANTIALIAS to LANCZOS
        resized_images.append(img)

    total_width = sum(img.size[0] for img in resized_images)
    new_im = Image.new('RGB', (total_width, max_height), color='white')

    x_offset = 0
    for img in resized_images:
        new_im.paste(img, (x_offset, 0))
        x_offset += img.size[0]

    new_im.save(output_path, format='JPEG')
from rapidfuzz import fuzz

# Function to check similarity
def is_similar_to_ludge(input_text, threshold=80):
    words = input_text.lower().split()
    return any(fuzz.ratio(word, "lobster") >= threshold for word in words)

# Dictionary mapping keywords to image filenames in static folder
SCULPTURE_BASES = {

    #Bases
    "champagne": os.path.join("bases", "champagne_base.png"),
    "crystal base": os.path.join("bases", "crystal_base.png"),
    "frame base": os.path.join("bases", "frame_base.png"),
    "golf base": os.path.join("bases", "golf_base.png"),
    "heart base": os.path.join("bases", "heartBase.png"),  # Modified name
    "plynth base w logo": os.path.join("bases", "Plynth base w logo.png"), # Exact name
    "rings base": os.path.join("bases", "rings base.png"), # Exact name
    "star base": os.path.join("bases", "Star base.png"), # Exact name
    "swirl base": os.path.join("bases", "swirl base.png"), # Exact name
    "tilt plynth base": os.path.join("bases", "tilt plynth base.png") ,# Exact name
   
    "plynth base": os.path.join("bases", "plynth_base.png"),
    "ring base": os.path.join("bases", "ring_base.png"),
    "tee base": os.path.join("bases", "tee_base.png"),
    "waves base": os.path.join("bases", "waves_base.png"),

    ##ludges

    "double ludge": os.path.join("sculptures", "double_ludge.png"),
    "martini": os.path.join("sculptures", "martini.png"),
    "tube": os.path.join("sculptures", "tube.png"),

    #Sculptures
        "alligator head": os.path.join("sculptures", "alligator_head.png"),
        "alligator": os.path.join("sculptures", "alligator.png"),
        "anchor": os.path.join("sculptures", "anchor.png"),
        "crab claw": os.path.join("sculptures", "crab claw.png"),
        "dolphin": os.path.join("sculptures", "dolphin.png"),
        "dragon head": os.path.join("sculptures", "dragon_head.png"),
        "griffen": os.path.join("sculptures", "griffen.png"),
        "guitar": os.path.join("sculptures", "guitar.png"),
        "heel": os.path.join("sculptures", "heel.png"),
        "horse head": os.path.join("sculptures", "horse_head.png"),
        "indian head": os.path.join("sculptures", "indian head.png"),
        "leopard": os.path.join("sculptures", "leopard.png"),
        "lion": os.path.join("sculptures", "lion.png"),
        "lobster": os.path.join("sculptures", "lobster.png"),
       
        "mahi mahi": os.path.join("sculptures", "mahi mahi.png"),
        "mask": os.path.join("sculptures", "mask.png"),
        "mermaid": os.path.join("sculptures", "mermaid.png"),
        "palm_trees": os.path.join("sculptures", "palm_trees.png"),
        "panther": os.path.join("sculptures", "panther.png"),
        "penguin": os.path.join("sculptures", "penguin.png"),
        "selfish": os.path.join("sculptures", "selfish.png"),
        "shark": os.path.join("sculptures", "shark.png"),
        "shrimp": os.path.join("sculptures", "shrimp.png"),
        "turkey": os.path.join("sculptures", "turkey.png"),
        "turle": os.path.join("sculptures", "turle.png"),
        "turtle cartoon": os.path.join("sculptures", "turtle_cartoon.png"),
        "unicorn": os.path.join("sculptures", "unicorn.png"),
        "vase": os.path.join("sculptures", "vase.png"),
        "whale": os.path.join("sculptures", "whale.png"),
        "women butt": os.path.join("sculptures", "women_butt.png"),
        "women torso": os.path.join("sculptures", "women_torso.png"),

        #Wedding Sculptures
        "interlocking rings": os.path.join("wedding_Showpieces", "interlocking_rings_showpiece_wedding.png"),
        "wedding frame": os.path.join("wedding_Showpieces", "picture_frame_wedding.png"),

        #Topper
        "banana single luge": os.path.join("Toppers", "banana single luge.jpg"),
        "ice bar mini single luge": os.path.join("Toppers", "ice bar mini single luge.jpg"),
        "ice bowl": os.path.join("Toppers", "ice bowl.png"),
        "crown logo as topper": os.path.join("Toppers", "crown logo as topper.jpg"),
        "crown logo as topper": os.path.join("Toppers", "crown logo as topper.jpg"),
        "crown logo as topper": os.path.join("Toppers", "crown logo as topper.jpg"),
            
         #Ice Bars
        "6ft ice bar": os.path.join("Ice bars", "6ft ice bar.jpg"),
        "8ft ice bar":os.path.join("Ice bars", "8ft ice bar.jpg"),   
        "12ft ice bar": os.path.join("Ice bars", "12ft ice bar.jpg"),   
        
       
        
        

        #LOGOS
    # "logo base": os.path.join("bases", "logo_base.png"),
    # "logo plynth base": os.path.join("bases", "logo_plynth_base.png"),

    # Add more mappings as needed
}
LUDGE_TYPES = {
    "martini": os.path.join("sculptures", "martini.png"),
    "tube": os.path.join("sculptures", "tube.png"),
    "double": os.path.join("sculptures", "double_ludge.png")
}

REFERENCE_IMAGES = {
    "double luge": [
        "static/double luge/BOOMBOX Double LUGE w J LOGO  Render.jpg",  # Replace with the actual path to your first reference image
        "static/double luge/HAKU VODKA Logo on KANPAI Double Luge.jpg"  # Replace with the actual path to your second reference image
        # "/static/uploads/butcher_3.jpg",  # Replace with the actual path to your third reference image
        # "/static/uploads/butcher_4.jpg",  # Replace with the actual path to your fourth reference image
    ]
    # Add more mappings for other sculptures later, e.g., "martini luge": [...]
}

# Then modify your ludge detection logic:
def detect_ludge_type(input_text):
    input_text = input_text.lower()
    for ludge in LUDGE_TYPES:
        if ludge in input_text:
            return LUDGE_TYPES[ludge]
    return None

def detect_sculpture_bases(input_text, threshold=80):
    """Detects which sculpture bases are mentioned in the input text."""
    input_text = input_text.lower()
    detected_bases = []
    
    # First remove "base" from input to avoid matching all bases
    input_without_base = input_text.replace("base", "").strip()
    if not input_without_base:  # If only "base" was specified
        input_without_base = input_text  # Use original input
    
    for keyword, image_path in SCULPTURE_BASES.items():
        # Get the main descriptor (remove "base" from keyword)
        main_keyword = keyword.replace("base", "").strip()
        
        # Check if main descriptor is in input
        if main_keyword and main_keyword in input_without_base:
            detected_bases.append(image_path)
        # Original exact match check (for full phrases)
        elif keyword in input_text:
            detected_bases.append(image_path)
        # Fuzzy matching only on main descriptors
        else:
            words = input_without_base.split()
            if any(fuzz.ratio(word, main_keyword) >= threshold for word in words):
                detected_bases.append(image_path)
    
    return detected_bases

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        image_url = data.get('image_url')  # e.g., /static/uploads/sculpture_61be3d96.png
        rating = data.get('rating')
        comment = data.get('comment')

        # Validate inputs
        if not image_url or not rating:
            return jsonify({'error': 'Missing image_url or rating'}), 400

        # Convert relative URL to absolute file path
        base_dir = os.path.abspath(os.path.dirname(__file__))
        image_path = os.path.join(base_dir, 'static/uploads', os.path.basename(image_url))
        print(f"Attempting to read image from: {image_path}")  # Debug log

        if not os.path.exists(image_path):
            return jsonify({'error': f'Image file not found at {image_path}'}), 404

        # Read the image file and convert to Base64
        with open(image_path, 'rb') as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            print(f"Base64 length: {len(base64_image)}")  # Debug log

        # Prepare feedback data for Google Apps Script
        feedback_data = {
            'imageData': base64_image,
            'rating': rating,
            'comment': comment or 'No comment provided'
        }

        # Send to Google Apps Script web app
        script_url = 'https://script.google.com/macros/s/AKfycbzKOxVD9ju-bewiQuCZS8hHByJ2JfU0mhhDbQFxWYIaQemRPgeJLtrvbOC8G-yf3vmg/exec'  # Replace with your web app URL
        response = requests.post(script_url, json=feedback_data, timeout=30)
        print(f"Google Apps Script response status: {response.status_code}, text: {response.text}")  # Debug log

        if response.status_code != 200:
            return jsonify({'error': f'Failed to save feedback, status: {response.status_code}, response: {response.text}'}), 500

        return jsonify({'message': 'Feedback submitted successfully'}), 200

    except FileNotFoundError as e:
        print(f"FileNotFoundError: {str(e)}")
        return jsonify({'error': f'Image file not found: {str(e)}'}), 404
    except PermissionError as e:
        print(f"PermissionError: {str(e)}")
        return jsonify({'error': f'Permission denied accessing image: {str(e)}'}), 403
    except Exception as e:
        print(f"Unexpected error in submit_feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
ICE_CUBE_PROMPTS = {
    "Snofilled": """
    "task": "add the image into the center of the icecube",
    "instructions": 
        "effect": "Create a carved snow-filled appearance inside the ice sculpture, the image should not be colored and it should be engraved into the icecube with some depth",
        "ice":"ice should be crystal clear, no bubbles or clouds"
        "Strict": "the logo should be engraved into the ice few centimeters with some depth",
        "Extra":"remove any background of the image before adding it to the icecube"
    """,
    "Colored": """
    "task": "add the image styles onto the icecube, ", 
    "instructions": 
        "effect": "it should look like the ice is colored and not etched",
        "Strict": "the image should be engraved into the ice few centimeters with some depth",
        "Extra":"remove any background of the image before adding it to the icecube",
        "ice":"ice should be crystal clear, no bubbles or clouds"
    """,
    "Paper": """
    "task": "add the image inside the icecube, ",
    "instructions": 
        "effect": "it should look like a colored printed paper is frozen into the icecube, the Logo should be colored with some white outline and transparent background and should be in center of the cube",
        "Strict": "the image should be placed into the ice few centimeters in some depth",
        "Extra":"remove any background of the image before adding it to the icecube",
        "ice":"ice should be crystal clear, no bubbles or clouds, increase the size of the cube if the logo doesnot fit"
    """,
    "Snofilled+paper": """
    "task": "add the image into the center of the icecube ",
    "instructions": 
        "effect": "it should look like a colored printed paper is frozen into the icecube, the paper should be colored and should be in center of the cube, and the ice should be etched a little bit on the outlines of the image logo",
        "Strict": "the logo should be engraved into the ice few centimeters with some depth",
        "Extra":"remove any background of the image before adding it to the icecube",
        "ice":"ice should be crystal clear, no bubbles or clouds"
    """
}

@app.route('/template_selected', methods=['POST'])
def handle_template_selection():
    data = request.get_json()
    template_type = data.get('template')
    template_name = data.get('templateName', '')
    
    # Print the template information
    print(f"Selected template type: {template_type}")
    if template_name:
        print(f"Selected template name: {template_name}")
    
    # Store the template type in session if it's an ice cube
    if template_type in ICE_CUBE_PROMPTS:
        session['selected_ice_cube'] = template_type
        print(f"Ice cube selected: {template_type}")  # This will now print for ice cubes
        print(f"Using prompt: {ICE_CUBE_PROMPTS[template_type]}")  # Print the prompt being used
    
    # For non-ice cube/ice bar templates, store the lighting message
    elif "ice bar" not in template_type.lower() and "ice cube" not in template_type.lower():
        session['template_selected_message'] = "Add a silver plastic rectangular led with decent blue lighting at the bottom of the sculpture"
        print("Lighting message set for non-ice template")
    
    return jsonify({"status": "success", "message": "Template selection received"})



client2 = genai.Client(api_key="AIzaSyCPw79xvCt4ZNOXJh4ORZ0OBZ4S7bZka7U")
MODEL_ID = "gemini-2.0-flash-exp"


@app.route('/extract_logo', methods=['POST'])
def extract_logo():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Securely save the uploaded file (optional, but recommended)
        filename = secure_filename(file.filename)
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        try:
            file.save(upload_path)
            print(f"File saved successfully to {upload_path}")  # Confirm
        except Exception as e:
            print(f"Error saving file: {e}")
            return jsonify({"error": f"Error saving file: {e}"}), 500


        # Print input image path (in-memory file, so just print filename)
        print("Received file:", file.filename)

        #image = Image.open(file) #Don't open in memory, load it from the uploaded file, if it fails there is something wrong with the image file
        try:
            image = Image.open(upload_path)
        except Exception as e:
            print(f"Error opening image with PIL: {e}")
            return jsonify({"error": f"Error opening image with PIL: {e}"}), 400



        # Prepare prompt
        prompt = "Extract the logo from this image. and display on a white background"  # More explicit prompt
        print(prompt)

        # Generate content with the prompt and image
        response = client2.models.generate_content(  # Using client.models.generate_content
            model=MODEL_ID,
            contents=[
                prompt,
                image
            ],
             config=types.GenerateContentConfig(
            response_modalities=['Text', 'Image']
        )
        )

        # Extract and return the image (adapted from your edit_image_with_prompt)
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                data = part.inline_data.data
                # Debug print the type and length
                print(f"Data type: {type(data)}")
                print(f"Data length: {len(data)}")

                logo_filename = "extracted_logo.png"
                logo_filepath = os.path.join(app.config['UPLOAD_FOLDER'], logo_filename)
                try:
                    pathlib.Path(logo_filepath).write_bytes(data)  # Write as bytes
                    return send_file(logo_filepath, mimetype='image/png')
                except Exception as e:
                    print(f"Error writing image to file: {e}")
                    return jsonify({"error": f"Error writing image to file: {e}"}), 500

        return jsonify({"error": "No image returned from model"}), 500


    except Exception as e:
        print("Error extracting logo:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/chatbot", methods=["POST"])
def chatbot():
    # Initialize conversation history if it doesn't exist
    if "conversation" not in session or not isinstance(session["conversation"], list):
        session["conversation"] = []

    # Limit conversation history size
    if len(session["conversation"]) > 5:
        session["conversation"] = session["conversation"][-5:]

    user_input = request.form.get("user_input", "").strip()
    uploaded_files = request.files.getlist("images")
    logging.debug(f"Received request.files: {request.files}")

    # Check for ice cube selection first
    selected_ice_cube = session.get('selected_ice_cube')
    image_generation_prompt = None
    
    if selected_ice_cube:
        ice_prompt = ICE_CUBE_PROMPTS.get(selected_ice_cube, "")
        image_generation_prompt = f"{ice_prompt}\nUSER INPUT:\n{user_input}"
        print(f"Using {selected_ice_cube} ice cube prompt with user input:\n{image_generation_prompt}")
        session.pop('selected_ice_cube', None)

    else:
    # Determine which prompt to use based on prefix
     image_generation_prompt = None

    # Convert to lowercase after checking prefixes
    user_input_lower = user_input.lower()

    # Check for ludge in user input
    detected_ludge = detect_ludge_type(user_input_lower)

    if "ludge" in user_input_lower and not detected_ludge:
        session["conversation"].append({"role": "user", "content": user_input})
        response = "Can you please specify which ludge? We have martini ludge, tube ludge, and double ludge."
        session["conversation"].append({"role": "assistant", "content": response})
        session.modified = True
        return jsonify({"response": response})

    # Detect base images from user input
    base_images = detect_sculpture_bases(user_input_lower)

    if detected_ludge:
        base_images.append(detected_ludge)
        
    # If user uploaded images or we detected base images
    if uploaded_files or base_images:

        
        # Save any uploaded files
        uploaded_paths = []
        if uploaded_files:
            uploaded_ids = [uuid.uuid4().hex[:8] for _ in uploaded_files]
            uploaded_paths = [os.path.join(app.config["UPLOAD_FOLDER"], f"uploaded_{id}.jpg") for id in uploaded_ids]
            for i, file in enumerate(uploaded_files):
                file.save(uploaded_paths[i])
                logging.debug(f"Saved uploaded file: {uploaded_paths[i]}")
        
        # Get full paths to any detected base images
        base_image_paths = [os.path.join("static", img) for img in base_images] if base_images else []
        
        combined_id = uuid.uuid4().hex[:8]
        combined_path = os.path.join(app.config["UPLOAD_FOLDER"], f"combined_{combined_id}.jpg")

        all_images = uploaded_paths + base_image_paths

        if all_images:
            try:
                combine_images(all_images, combined_path)
                logging.debug(f"Combined image saved to: {combined_path}")
            except ValueError as e:
                return jsonify({"response": str(e)})
            except Exception as e:
                return jsonify({"response": f"Error combining images: {str(e)}"})
        else:
            return jsonify({"response": "No valid images provided"})

        # Use the appropriate prompt based on prefix
        if not image_generation_prompt:
            image_generation_prompt = f"""
        USER INPUT:
        {user_input}
        STRICT INSTRUCTIONS FOR ICE SCULPTURE GENERATION:
        1. SCULPTURE PRESERVATION:
           - Maintain EXACT shape, proportions, and details from the reference image
           - Do NOT alter, add, or remove any elements of the sculpture
           - Preserve all original contours and features precisely
           - Sculpture should be large, around 6 to 7 feet tall or wide accordingly
           - dark and light blue color in the image always means ice

        2. MATERIAL PROPERTIES:
           - Render as crystal-clear, see-through ice
           - Include realistic light refraction and subtle imperfections
           - Surface should appear smooth and polished

        3. BACKGROUND AND ENVIRONMENT
            -place the sculpture on a wooden table in a realistic environment or a country club.
            
        
        
        4. PROHIBITED MODIFICATIONS:
           - NO changes to the sculpture structure
           - NO additional decorative elements
           - NO human figures or living creatures
           - no elements detached from the sculpture even if requested
           - no small details
           - no foggy ice
           - no extra ice base for the sculpture..
           - no changes in the sculpture itself allowed
           - do not change the sculpture design
           - no extra ice pieces on the sculpture
           - place the sculpture directly on the table and no extra ice base 
           - no extra ice base
           - do not add extra ice base

        5.IMAGE QUALITY:
         -Always create an HD high resolution image, captured by a high resolution camera.

        6.IF IMAGE(sticker) on SCULPTURES:
         -If there is an image present in a sculpture design, then:
        "effect": "if any detail is shown in the image that is other that blue color, then it should look like a paper sticker is pasted on the ice sculpture, the paper should be colored, and not made of ice",
        "important": Do not include the logo of the company in the sculpture which says 'ice butcher, purveyors of perfect ice'

        7.EXTRA:

         -IF 'TOPPER' is mentioned in an image, then it means that it will be placed on top of the sculpture at the very top (BUT DONT ADD THE 'TOPPER' TEXT).
         -IF 'TOPPER(WITH LOGO)' is mentioned in an image, then it means that it will be placed on top of the sculpture at the very top with a logo in the center of the topper, DO NOT ADD A LOGO BY YOURSELF IF IT IS NOT PROVIDED, JUST KEEP IT EMPTY.
         CRUCIAL:(REMEMBER NOT TO MODIFY THE BASE SCULPTURE EVEN A LITTLE BIT, THE SCULPTURE SHOULD MATCH EXACTLY LIKE IN THE IMAGE, NO EXTRA MODIFICATIONS ALLOWED, JUST PLACE THE TOPPER ON TOP WITHOUT CHANGING THE SCULPTURE ITSELF.)

         -If "BASE" is mentioned in an image, it indicates that the item serves as the foundation of the sculpture, and should be placed exactly at the bottom of the main sculpture (BUT DONT ADD THE 'BASE' TEXT).
         CRICIAL:-(REMEMBER NOT TO MODIFY THE BASE SCULPTURE EVEN A LITTLE BIT, THE SCULPTURE SHOULD MATCH EXACTLY LIKE IN THE IMAGE, NO EXTRA MODIFICATIONS ALLOWED, JUST PLACE THE BASE AT THE BOTTOM WITHOUT CHANGING THE SCULPTURE ITSELF.)

         REMINDER:DO NOT ADD THE 'TOPPER', 'TOPPER(WITH LOGO)' AND 'BASE' TEXT IN THE SCULPTURE, THAT IS JUST FOR UNDERSTANDING. 
        
        """
            
        if 'template_selected_message' in session:
            image_generation_prompt += f"\n\nNOTE: {session['template_selected_message']}"
            # Clear the message after using it to avoid repetition
            session.pop('template_selected_message', None)
        
        try:
            with open(combined_path, "rb") as image_file:
                result = client.images.edit(
                    model="gpt-image-1",
                    
                    image=image_file,
                    prompt=image_generation_prompt,
                    
                
                    
                )
            
            output_id = uuid.uuid4().hex[:8]
            output_filename = f"sculpture_{output_id}.png"
            print("Image Created")
            output_path = os.path.join(app.config["UPLOAD_FOLDER"], output_filename)

            image_bytes = base64.b64decode(result.data[0].b64_json)
            with open(output_path, "wb") as f:
                f.write(image_bytes)

            session["conversation"].append({"role": "user", "content": user_input})
            session["conversation"].append({
                "role": "assistant", 
                "content": "Here is your ice sculpture:",
                "image": f"/static/uploads/{output_filename}"
            })
            session.modified = True

            return jsonify({
                # "response": "Here's your custom ice sculpture:",
                "image_url": f"/static/uploads/{output_filename}"
            })
        except Exception as e:
            return jsonify({"response": f"Error generating sculpture image: {str(e)}"})

    # If no images were uploaded or detected, proceed with text/classification flow
    try:
        classification = classify_prompt_type(user_input)
        print(f"Prompt classified as: {classification}")

        # Normal text conversation (with memory)
        if classification == "text":
            system_prompt = f"""You are an AI assistant for an ice sculpture company. You can create ice sculpture images 
            from text prompts using the latest GPT image generation model. You also accept image inputs for editing 
            based on user prompts. Never say you can't generate or edit images — just use the input prompt to create 
            a realistic ice sculpture.
            """
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ]
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=messages
            )
            gpt_response = completion.choices[0].message.content
            session["conversation"].append({"role": "user", "content": user_input})
            session["conversation"].append({"role": "assistant", "content": gpt_response})
            return jsonify({"response": gpt_response})

        # Image generation flow
        elif classification == "generate":
            generation_id = uuid.uuid4().hex[:8]
            
            # Use the appropriate prompt based on prefix if not already set
            if not image_generation_prompt:
                image_generation_prompt = f"""
        "task": "Generate realistic images of ice engravings based solely on user text input.",
        "instructions": 
            "design": "Accurately follow the user's text description with no creative additions or modifications.",
            "ice_quality": "Use natural, crystal-clear ice with realistic light refraction. No bubbles, rough edges, or imperfections.",
            "surface": "Ice must appear smooth, clean, and polished.",
            "detail_level": "Keep details minimal; emphasize the natural beauty of ice.",
            "creativity": "This is a technical execution. No creative interpretation.",
            "environment": "Place the sculpture the requested theme, but do not change the look of the sculpture until requested explicitly",
            "small items":"do not add any items items that cannot be made by ice or that can be easily broken",
            "human_presence": "Do not include any humans in the image." 
            "user_input": {user_input}
    """
            result = client.images.generate(
                model="gpt-image-1",
                
                prompt=image_generation_prompt,
                
                
            )

            output_filename = f"generated_{generation_id}.png"
            print("Image Created")
            output_path = os.path.join(app.config["UPLOAD_FOLDER"], output_filename)

            image_bytes = base64.b64decode(result.data[0].b64_json)
            with open(output_path, "wb") as f:
                f.write(image_bytes)

            session["conversation"].append({"role": "user", "content": user_input})
            session["conversation"].append({
                "role": "assistant", 
                "content": "Here is your ice sculpture:",
                "image": f"/static/uploads/{output_filename}"
            })
            session.modified = True

            return jsonify({
                "response": "Here is your ice sculpture:",
                "image_url": f"/static/uploads/{output_filename}"
            })

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"})

if __name__ == "__main__":
    if not os.path.exists(app.config["UPLOAD_FOLDER"]):
        os.makedirs(app.config["UPLOAD_FOLDER"])
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
