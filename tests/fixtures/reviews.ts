import type { Review } from '@/lib/types/database'
import { mockReview } from '../helpers/mocks'

export const fiveStarReviews: Review[] = [
  mockReview({
    id: 'rev-5star-1',
    star_rating: 5,
    reviewer_name: 'Alice Johnson',
    review_text:
      'Absolutely wonderful experience! The staff was incredibly friendly and the food was outstanding. Will definitely be coming back.',
    sentiment: 'positive',
  }),
  mockReview({
    id: 'rev-5star-2',
    star_rating: 5,
    reviewer_name: 'Bob Martinez',
    review_text:
      'Best restaurant in town. The ambiance is perfect and the service is top-notch. Every dish was cooked to perfection.',
    sentiment: 'positive',
  }),
  mockReview({
    id: 'rev-5star-3',
    star_rating: 5,
    reviewer_name: 'Carol Williams',
    review_text:
      'We celebrated our anniversary here and it was magical. The chef even came out to greet us. Highly recommend!',
    sentiment: 'positive',
  }),
]

export const oneStarReviews: Review[] = [
  mockReview({
    id: 'rev-1star-1',
    star_rating: 1,
    reviewer_name: 'Dave Thompson',
    review_text:
      'Terrible experience. Waited 45 minutes for our food, and when it arrived it was cold. The manager was dismissive when we complained.',
    sentiment: 'negative',
  }),
  mockReview({
    id: 'rev-1star-2',
    star_rating: 1,
    reviewer_name: 'Eve Garcia',
    review_text:
      'Found a hair in my soup. When I told the waiter, they just shrugged. Never coming back. Save your money and go somewhere else.',
    sentiment: 'negative',
  }),
  mockReview({
    id: 'rev-1star-3',
    star_rating: 1,
    reviewer_name: 'Frank Lee',
    review_text:
      'The worst dining experience of my life. Rude staff, dirty tables, and overpriced food that tasted like it came from a microwave.',
    sentiment: 'negative',
  }),
]

export const suspiciousReviews: Review[] = [
  mockReview({
    id: 'rev-sus-1',
    star_rating: 1,
    reviewer_name: 'Anonymous',
    review_text: 'Bad. Dont go.',
    sentiment: 'negative',
  }),
  mockReview({
    id: 'rev-sus-2',
    star_rating: 1,
    reviewer_name: 'John Smith',
    review_text:
      'Never been here but heard from a friend that it was awful. Zero stars if I could. The owner should be arrested for fraud.',
    sentiment: 'negative',
  }),
]

export const mixedReviews: Review[] = [
  fiveStarReviews[0],
  fiveStarReviews[1],
  mockReview({
    id: 'rev-3star-1',
    star_rating: 3,
    reviewer_name: 'Grace Park',
    review_text:
      'Average experience. Food was decent but nothing special. Service was a bit slow but the waiter was friendly.',
    sentiment: 'neutral',
  }),
  oneStarReviews[0],
  mockReview({
    id: 'rev-4star-1',
    star_rating: 4,
    reviewer_name: 'Henry Wilson',
    review_text:
      'Really good food and great atmosphere. Only reason for 4 stars instead of 5 is parking was difficult to find.',
    sentiment: 'positive',
  }),
]
