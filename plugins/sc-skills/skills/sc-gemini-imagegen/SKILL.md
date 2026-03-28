---
name: sc-gemini-imagegen
description: Generate and edit images using the Gemini API (Nano Banana). This skill SHOULD be used when creating images from text prompts, editing existing images, applying style transfers, generating logos with text, creating stickers, product mockups, or any image generation/manipulation task. Supports text-to-image, image editing, multi-turn refinement, and composition from multiple reference images.
---

# Gemini Image Generation

Generate and edit images using Google's Gemini API. The SDK reads `GOOGLE_API_KEY` by default (`GEMINI_API_KEY` as fallback). Or pass a key explicitly to `genai.Client(api_key=...)`.

## Models

| Model | Codename | Best For |
|-------|----------|----------|
| `gemini-2.5-flash-image` | Nano Banana | Most use cases, fast, good quality (default) |
| `gemini-3-pro-image-preview` | Nano Banana Pro | High-res (2K/4K), Google Search grounding, precise text |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | High volume, extended aspect ratios, 512 size |

Start with `gemini-2.5-flash-image`. Upgrade to Pro for high-res output or search grounding.

## Quick Reference

### Default Settings
- **Model:** `gemini-2.5-flash-image`
- **Resolution:** 1K (default)
- **Aspect Ratio:** 1:1 (default)

### Available Aspect Ratios

All models: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

3.1 Flash only: `1:4`, `4:1`, `1:8`, `8:1`

### Available Resolutions

All models: `1K` (default), `2K`, `4K`

3.1 Flash only: `512`

## Core API Pattern

```python
from google import genai
from google.genai import types

client = genai.Client()  # Reads GOOGLE_API_KEY (or GEMINI_API_KEY fallback)

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents="Your prompt here",
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("output.jpg")  # save() takes path only, writes raw bytes
```

**Note:** `response_modalities` is optional. Omit it to let the model decide. Set `['IMAGE']` for image-only output, or `['TEXT', 'IMAGE']` for interleaved text and images.

## Custom Resolution & Aspect Ratio

```python
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=prompt,
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="2K",
        ),
    ),
)
```

## Editing Images (Chat Mode)

Chat mode is recommended for editing. The SDK handles thought signatures automatically across turns.

```python
from PIL import Image

client = genai.Client()
image = Image.open("input.png")

chat = client.chats.create(model="gemini-2.5-flash-image")

# First edit
response = chat.send_message(["Add a sunset to this scene", image])

for i, part in enumerate(response.candidates[0].content.parts):
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save(f"edited_{i}.jpg")

# Continue refining
response = chat.send_message("Make the colors warmer")
```

PIL Image objects, base64 bytes, and file URIs (via `client.files.upload()`) all work as image inputs.

## Google Search Grounding

Generate images informed by real-time data. Requires Pro model.

```python
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents="Visualize today's weather in Tokyo as an infographic",
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="1K",
        ),
        tools=[types.Tool(google_search=types.GoogleSearch())],
    ),
)
```

Image search grounding (searching for reference images) is only available on `gemini-3.1-flash-image-preview`.

## Multiple Reference Images

Combine elements from multiple sources. Pass PIL Image objects directly in the contents list.

```python
from PIL import Image

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[
        "Create a group photo of these people in an office",
        Image.open("person1.png"),
        Image.open("person2.png"),
        Image.open("person3.png"),
    ],
)
```

Limits differ by model:
- **3.1 Flash:** up to 10 object images + 4 character images (14 total)
- **3 Pro:** up to 6 object images + 5 character images (11 total)

## Prompting Best Practices

### Photorealistic Scenes
Include camera details: lens type, lighting, angle, mood.
> "A photorealistic close-up portrait, 85mm lens, soft golden hour light, shallow depth of field"

### Stylized Art
Specify style explicitly:
> "A kawaii-style sticker of a happy red panda, bold outlines, cel-shading, white background"

### Text in Images
Be explicit about font style and placement:
> "Create a logo with text 'Daily Grind' in clean sans-serif, black and white, coffee bean motif"

### Product Mockups
Describe lighting setup and surface:
> "Studio-lit product photo on polished concrete, three-point softbox setup, 45-degree angle"

## File Format & Saving

The API returns JPEG in practice. `image.save(path)` writes raw bytes from the API response. It takes only a path string (no `format` kwarg).

```python
# Save as-is (JPEG bytes from the API)
image.save("output.jpg")
```

To convert formats, use PIL on the raw bytes:

```python
from PIL import Image
import io

for part in response.parts:
    if part.inline_data is not None:
        pil_img = Image.open(io.BytesIO(part.inline_data.data))
        pil_img.save("output.png")  # PIL handles the conversion
```

## Notes

- All generated images include SynthID watermarks (not configurable for Gemini models)
- `save(path)` writes raw bytes; no `format` kwarg exists. Use PIL for format conversion
- `response_modalities` is optional; omit to let the model decide output format
- Multi-turn chat handles thought signatures automatically via the SDK
- Editing via chat mode doesn't support `image_config` (only modality config)
- For editing, describe changes conversationally; the model understands semantic masking
- Default to 1K for speed; use 2K/4K when quality matters
- `person_generation` parameter exists on `ImageConfig` for controlling person depiction in outputs
