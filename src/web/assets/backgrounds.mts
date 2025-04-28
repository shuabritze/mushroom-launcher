const images = import.meta.glob("../assets/backgrounds/*.jpg", {
    eager: true,
    import: "default",
  });
  
  export const backgrounds = Object.values(images).map((image) => image as string);