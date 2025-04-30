use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn run() {
    let document = web_sys::window().unwrap().document().unwrap();
    let body = document.body().unwrap();
    
    // Create UI elements
    let title = document.create_element("h1").unwrap();
    title.set_text_content(Some("Navigation Simulator"));
    
    let coords_display = document.create_element("div").unwrap();
    coords_display.set_id("coords-display");
    
    // Sample coordinates with hardcoded altitudes
    let coordinates = [
        ("New York", 40.7128, -74.0060, 10.0),
        ("Tokyo", 35.6762, 139.6503, 40.0),
        ("Paris", 48.8566, 2.3522, 35.0),
    ];
    
    // Create buttons for each location
    for (name, lat, lon, alt) in coordinates.iter() {
        let button = document.create_element("button").unwrap();
        button.set_text_content(Some(&format!("{}", name)));
        button.set_attribute("class", "location-btn").unwrap();
        
        let coords_display_clone = coords_display.clone();
        let closure = Closure::wrap(Box::new(move || {
            coords_display_clone.set_inner_html(&format!(
                "<h3>{}</h3>
                <p>Latitude: {:.4}°</p>
                <p>Longitude: {:.4}°</p>
                <p class='altitude'>Altitude: {:.1} meters</p>",
                name, lat, lon, alt
            ));
            console::log_1(&format!("Selected {}: {}°, {}°, {}m", name, lat, lon, alt).into());
        }) as Box<dyn Fn()>);
        
        button.add_event_listener_with_callback("click", closure.as_ref().unchecked_ref()).unwrap();
        closure.forget();
        
        body.append_child(&button).unwrap();
    }
    
    // Add elements to page
    body.append_child(&title).unwrap();
    body.append_child(&coords_display).unwrap();
}
