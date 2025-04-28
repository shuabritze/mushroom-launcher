const images = import.meta.glob("../assets/characters/*.png", {
  eager: true,
  import: "default",
});

export const characters = Object.values(images).map((image) => image as string);