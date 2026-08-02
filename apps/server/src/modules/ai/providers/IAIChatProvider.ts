export interface IAIChatProvider {
  /**
   * Generates conversational text response based on a prompt.
   * @param prompt User's input prompt
   */
  generateText(prompt: string): Promise<string>;

  /**
   * Generates a code snippet based on a prompt.
   * @param prompt User's input prompt
   */
  generateCode(prompt: string): Promise<string>;

  /**
   * Generates an image based on a prompt.
   * @param prompt User's input prompt
   * @returns Base64 encoded string or URL of the generated image
   */
  generateImage(prompt: string): Promise<string>;
}
