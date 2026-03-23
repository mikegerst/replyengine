import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Seeding database...')

  // Find the first user to use as owner
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError || !users.users.length) {
    console.error('No users found. Sign up first, then run seed.')
    process.exit(1)
  }

  const ownerId = users.users[0].id
  console.log(`Using owner: ${users.users[0].email} (${ownerId})`)

  // Check if a business already exists for this user
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', ownerId)
    .limit(1)

  if (existing && existing.length > 0) {
    console.log('Business already exists — deleting old data first...')
    await supabase.from('reviews').delete().eq('business_id', existing[0].id)
    await supabase.from('businesses').delete().eq('id', existing[0].id)
  }

  // Insert business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      owner_id: ownerId,
      name: "Mike's Kitchen & Grill",
      business_type: 'Restaurant',
      tone: 'friendly',
      response_length: 'medium',
      custom_instructions:
        'We are a family-owned restaurant known for our wood-fired pizzas and craft cocktails. ' +
        'Always mention we are open Tuesday through Sunday, 11am-10pm. ' +
        'For unhappy customers, invite them back for a complimentary appetizer.',
      auto_respond: false,
      auto_respond_min_stars: 4,
      notification_email: true,
      plan: 'pro',
      phone: '(555) 234-5678',
    })
    .select()
    .single()

  if (bizError || !business) {
    console.error('Failed to create business:', bizError?.message)
    process.exit(1)
  }

  console.log(`Created business: ${business.name} (${business.id})`)

  // Insert demo reviews
  const reviews = getDemoReviews(business.id)

  const { data: inserted, error: reviewsError } = await supabase
    .from('reviews')
    .insert(reviews)
    .select()

  if (reviewsError) {
    console.error('Failed to insert reviews:', reviewsError.message)
    process.exit(1)
  }

  console.log(`Inserted ${inserted?.length ?? 0} demo reviews`)
  console.log('\nSeed complete!')
}

function getDemoReviews(businessId: string) {
  const now = Date.now()
  const day = 86400000

  return [
    {
      business_id: businessId,
      reviewer_name: 'Sarah M.',
      star_rating: 5,
      review_text:
        'Absolutely incredible experience! The wood-fired margherita pizza was the best I\'ve ever had — ' +
        'perfectly charred crust, fresh mozzarella, beautiful basil. Our server Jake was attentive without ' +
        'being overbearing. The craft old fashioned was top-notch. Will be back every week!',
      review_date: new Date(now - 2 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'Tom R.',
      star_rating: 5,
      review_text:
        'Celebrated our anniversary here and it was perfect. The ambiance is warm and cozy, ' +
        'the bruschetta appetizer was fresh and flavorful, and the pasta special was outstanding. ' +
        'Thank you for making our evening so special!',
      review_date: new Date(now - 3 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'Jessica L.',
      star_rating: 4,
      review_text:
        'Great food and nice atmosphere. The pepperoni pizza was delicious and the salad was very fresh. ' +
        'Only reason for 4 stars is the wait was about 30 minutes even with a reservation on a Saturday night. ' +
        'Would still recommend though!',
      review_date: new Date(now - 5 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'David K.',
      star_rating: 4,
      review_text:
        'Solid neighborhood restaurant. The burger was cooked exactly how I asked and the fries were crispy. ' +
        'Beer selection is good. Parking is a bit tricky but worth it.',
      review_date: new Date(now - 7 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'Amanda P.',
      star_rating: 3,
      review_text:
        'Food was decent but not amazing. I ordered the chicken parmesan and it was a bit dry. ' +
        'The service was friendly enough but they forgot our bread basket twice. ' +
        'Might give it another try since friends rave about the pizza.',
      review_date: new Date(now - 10 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'Carlos G.',
      star_rating: 2,
      review_text:
        'Waited 45 minutes for our entrees on a Wednesday night when the restaurant was half empty. ' +
        'The food was lukewarm when it arrived. Asked to speak with a manager but was told none was available. ' +
        'Disappointing because the food itself actually tasted good when it finally came.',
      review_date: new Date(now - 12 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'Rachel W.',
      star_rating: 1,
      review_text:
        'Terrible experience. Found a hair in my salad, and when I pointed it out the server just ' +
        'shrugged and offered to bring another one. No apology from management. ' +
        'The table next to us had a similar complaint about their food. Won\'t be coming back.',
      review_date: new Date(now - 14 * day).toISOString(),
      response_status: 'pending',
    },
    {
      business_id: businessId,
      reviewer_name: 'Brian T.',
      star_rating: 5,
      review_text:
        'Best pizza in town, hands down. We come here at least twice a month. ' +
        'The kids love the cheese pizza and my wife and I always get the white truffle pizza. ' +
        'Mike himself came to our table to say hi. Love this place!',
      review_date: new Date(now - 1 * day).toISOString(),
      response_status: 'pending',
    },
  ]
}

seed()
