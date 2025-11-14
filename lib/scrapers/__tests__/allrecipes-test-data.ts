import { createExpectedRecipe, createIngredientGroup } from './test-utils';

/**
 * Expected recipe data for AllRecipes test cases
 */
export const classicDinnerRollsData = createExpectedRecipe({
    name: 'Classic Dinner Rolls',
    prepTime: '20 mins',
    cookTime: '25 mins',
    totalTime: '1 hr 25 mins',
    servings: '12',
    ingredients: [
        createIngredientGroup([
            '2 cups all-purpose flour, divided, or as needed',
            '2 tablespoons white sugar',
            '1 (.25 ounce) envelope Fleischmann\'s RapidRise Yeast',
            '½ teaspoon salt',
            '½ cup milk',
            '¼ cup water',
            '2 tablespoons butter, plus more for brushing'
        ])
    ],
    directions: [
        'Gather the ingredients.',
        'Combine ¾ cup flour, sugar, undissolved yeast, and salt in a large bowl.',
        'Heat milk, water, and 2 tablespoons butter in a saucepan until very warm (120 degrees to 130 degrees F).',
        'Add warm milk mixture to the flour mixture. Beat for 2 minutes on medium speed of an electric mixer, scraping the bowl occasionally. Add ¼ cup flour; beat for 2 minutes at high speed. Stir in enough remaining flour to make soft dough.',
        'Knead dough on a lightly floured surface until smooth and elastic, about 8 to 10 minutes. Cover; let rest for 10 minutes.',
        'Divide dough into 12 equal pieces.',
        'Shape pieces into balls and place in a greased 8-inch round pan. Cover and let rise in warm, draft-free place until doubled in size, about 30 minutes. Preheat the oven to 375 degrees F (190 degrees C).',
        'Bake rolls in the preheated oven until golden brown on top, about 20 minutes.',
        'Brush with melted butter if you like.',
        'Serve warm and enjoy!'
    ],
    previewUrl: {
        shouldBeDefined: true,
        shouldContain: ['allrecipes.com', '.jpg']
    }
});

export const miniBrownieTurkeysData = createExpectedRecipe({
    name: 'Mini Brownie Turkeys',
    prepTime: '30 mins',
    cookTime: '15 mins',
    totalTime: '1 hr 10 mins',
    servings: '12',
    ingredients: [
        createIngredientGroup([
            'Nonstick cooking spray (such as BakeEasy®)'
        ]),
        createIngredientGroup([
            '¼ cup butter, softened',
            '½ cup white sugar',
            '1 large egg',
            '½ teaspoon vanilla extract',
            '¼ cup all-purpose flour',
            '3 tablespoons unsweetened cocoa powder',
            '⅛ teaspoon baking powder',
            '⅛ teaspoon salt'
        ], 'Mini Brownies'),
        createIngredientGroup([
            '3 tablespoons butter, softened',
            '3 tablespoons unsweetened cocoa powder',
            '1 ½ tablespoons milk',
            '1 cup powdered sugar'
        ], 'Frosting'),
        createIngredientGroup([
            '24 candy eyeballs',
            '12 red candy-coated chocolate pieces (such as M&M\'s®)',
            '60 candy corn, or as needed'
        ], 'Decoration')
    ],
    directions: [
        'Preheat the oven to 350 degrees F (175 degrees C). Spray a 12-cup mini muffin tin with cooking spray.',
        'Make the brownies: Cream butter and sugar together in a bowl with an electric mixer. Add egg and vanilla; mix well. Stir flour, cocoa powder, baking powder, and salt together in a separate bowl. Add flour mixture to butter mixture and mix until batter is smooth. Divide batter evenly among the prepared muffin cups.',
        'Bake in the preheated oven until a toothpick inserted into the center comes out clean, about 14 minutes. Cool in the tin for 5 minutes. Transfer to a wire rack and let cool, about 20 minutes.',
        'Meanwhile, prepare the frosting: Combine butter, cocoa powder, and milk in a bowl and mix with an electric mixer until smooth. Gradually add powdered sugar and mix until frosting is smooth and fluffy.',
        'Spoon frosting in a piping bag fitted with a Wilton #10 tip. Pipe a circle of frosting near the bottom half of each mini brownie to create the turkey\'s head. Add two candy eyes. Add 1 red chocolate piece to form the beak. Pipe 5 lines of frosting in the shape of a semi-circle formation coming up from the head. Place a piece of candy corn on each of the 5 lines to form the turkey\'s feathers.'
    ],
    previewUrl: {
        shouldBeDefined: true,
        shouldContain: ['allrecipes.com', '.jpg']
    }
});