import { portraitKey, portraitUrl } from "@/lib/petPortrait";

describe("portraitKey", () => {
  it("reconoce razas de perro sin importar tildes ni mayúsculas", () => {
    expect(portraitKey("perro", "Golden retriever")).toBe("golden");
    expect(portraitKey("perro", "Pastor Alemán")).toBe("pastor-aleman");
    expect(portraitKey("perro", "BULLDOG FRANCÉS")).toBe("bulldog-frances");
    expect(portraitKey("perro", "Criollo")).toBe("mestizo");
  });

  it("reconoce gatos por raza o color", () => {
    expect(portraitKey("gato", "Europeo gris")).toBe("gato-gris");
    expect(portraitKey("gato", "Siamés")).toBe("gato-siames");
    expect(portraitKey("gato", "Naranja")).toBe("gato-naranja");
  });

  it("usa el retrato genérico de la especie si no reconoce la raza", () => {
    expect(portraitKey("perro", "Xoloitzcuintle")).toBe("perro");
    expect(portraitKey("gato", null)).toBe("gato");
    expect(portraitKey("conejo", "Belier")).toBe("conejo");
    expect(portraitKey("otro", "Hámster")).toBe("otro");
  });

  it("arma la ruta pública", () => {
    expect(portraitUrl("perro", "Beagle")).toBe("/avatars/real/beagle.jpg");
  });
});
