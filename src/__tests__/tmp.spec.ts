/* eslint-disable jest/no-standalone-expect */

import { describeVariants, getResolvedState, resolveTimeline } from './testlib'

describeVariants(
	'regression',
	(test, fixTimeline, getCache) => {
		test('#1', () => {
			const tl = TL
			const timeline = fixTimeline(tl)

			const time = 600
			const resolved = resolveTimeline(timeline, { time, cache: getCache() })

			const state0 = getResolvedState(resolved, time)
			expect(state0.time).toEqual(time)

			expect(state0.layers).toMatchObject({
				L1: {
					content: { input: 3 },
				},
			})
		})
	},
	{
		normal: true,
	}
)

const TL = [
	{
		id: 'part_group',
		enable: { start: 0 },
		priority: 5,
		layer: '',
		content: {},
		children: [
			{
				id: 'child_obj_A',
				enable: {
					start: 200,
					end: '#cap_obj.start + 0',
				},
				layer: 'L1',
				content: { input: 1 },
				priority: 0,
			},
			{
				id: 'child_obj_B',
				enable: { start: 300 },
				layer: 'L1',
				content: { input: 1 },
				priority: 0,
			},
		],
		isGroup: true,
	},
	{
		id: 'cap_obj',
		enable: { start: 500 },
		layer: '',
		content: {},
		priority: 0,
	},
	{
		id: 'obj_wrong',
		enable: {
			start: '#child_obj_A.start + 0',
			end: '#child_obj_B.start',
		},
		layer: 'L1',
		content: { input: 2 },
		priority: 0.1,
	},
	{
		id: 'obj_expected',
		enable: { start: '#child_obj_B.start + 0' },
		layer: 'L1',
		content: { input: 3 },
		priority: 0.05,
	},
]
