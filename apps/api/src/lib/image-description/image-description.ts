export abstract class ImageDescription {
  abstract getDescription(imageUrl: string): Promise<string>;
}
