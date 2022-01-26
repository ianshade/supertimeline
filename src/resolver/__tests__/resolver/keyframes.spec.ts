import { EventType, Resolver } from '../../..'
import { describeVariants } from '../testlib'

describeVariants(
	'Resolver, keyframes',
	(test, fixTimeline, getCache) => {
		beforeEach(() => {
			// resetId()
		})
		test('simple keyframes', () => {
			const timeline = fixTimeline([
				{
					id: 'video',
					layer: '0',
					enable: {
						start: 0,
						end: 100,
					},
					content: {},
				},
				{
					id: 'graphic0',
					layer: '1',
					enable: {
						start: '#video.start + 10', // 10
						duration: 50,
					},
					content: {
						attr0: 'base',
						attr1: 'base',
						attr2: 'base',
						attr3: 'base',
					},
					keyframes: [
						{
							id: 'kf0',
							enable: {
								start: 3, // 13
							},
							content: {
								attr0: 'kf0',
								attr1: 'kf0',
							},
						},
						{
							id: 'kf1',
							enable: {
								start: '#kf0 + 7', // 20
								duration: '5', // 25
							},
							content: {
								attr0: 'kf1',
								attr2: 'kf1',
							},
						},
					],
				},
			])

			const resolved = Resolver.resolveAllStates(
				Resolver.resolveTimeline(timeline, { cache: getCache(), time: 0, limitTime: 50 })
			)

			expect(resolved.statistics.resolvedObjectCount).toEqual(2)
			expect(resolved.statistics.resolvedKeyframeCount).toEqual(2)
			expect(resolved.statistics.unresolvedCount).toEqual(0)

			expect(resolved.objects['video']).toBeTruthy()
			expect(resolved.objects['graphic0']).toBeTruthy()
			expect(resolved.objects['kf0']).toBeTruthy()
			expect(resolved.objects['kf1']).toBeTruthy()

			expect(resolved.objects['kf0'].resolved.instances).toMatchObject([
				{
					start: 13,
					end: 60, // capped by parent
				},
			])
			expect(resolved.objects['kf1'].resolved.instances).toMatchObject([
				{
					start: 20,
					end: 25,
				},
			])
			const state0 = Resolver.getState(resolved, 11)
			expect(state0).toMatchObject({
				layers: {
					'1': {
						id: 'graphic0',
						content: {
							attr0: 'base',
							attr1: 'base',
							attr2: 'base',
							attr3: 'base',
						},
					},
				},
				nextEvents: [
					{
						time: 13,
						type: EventType.KEYFRAME,
						objId: 'kf0',
					},
					{
						time: 20,
						type: EventType.KEYFRAME,
						objId: 'kf1',
					},
					{
						time: 25,
						type: EventType.KEYFRAME,
						objId: 'kf1',
					},
					{
						time: 60,
						type: EventType.END,
						objId: 'graphic0',
					},
					{
						time: 100,
						type: EventType.END,
						objId: 'video',
					},
				],
			})
			expect(Resolver.getState(resolved, 13).layers).toMatchObject({
				'1': {
					id: 'graphic0',
					content: {
						attr0: 'kf0',
						attr1: 'kf0',
						attr2: 'base',
						attr3: 'base',
					},
				},
			})
			expect(Resolver.getState(resolved, 21).layers).toMatchObject({
				'1': {
					id: 'graphic0',
					content: {
						attr0: 'kf1',
						attr1: 'kf0',
						attr2: 'kf1',
						attr3: 'base',
					},
				},
			})
			expect(Resolver.getState(resolved, 26).layers).toMatchObject({
				'1': {
					id: 'graphic0',
					content: {
						attr0: 'kf0',
						attr1: 'kf0',
						attr2: 'base',
						attr3: 'base',
					},
				},
			})
		})
		test('Keyframe falsey enable', () => {
			const timeline = fixTimeline([
				{
					id: 'video0',
					layer: '0',
					enable: {
						start: 1,
					},
					content: {
						val: 1,
					},
					keyframes: [
						{
							id: 'keyframe0',
							enable: { while: '!.class0' },
							content: {
								val2: 2,
							},
						},
					],
				},
				{
					id: 'enabler0',
					layer: '1',
					enable: {
						start: 100,
					},
					content: {},
					classes: ['class0'],
				},
			])

			const resolved = Resolver.resolveAllStates(
				Resolver.resolveTimeline(timeline, { cache: getCache(), time: 0, limitCount: 10, limitTime: 999 })
			)

			expect(resolved.statistics.resolvedObjectCount).toEqual(2)
			expect(resolved.statistics.unresolvedCount).toEqual(0)

			expect(resolved.objects['video0']).toBeTruthy()
			expect(resolved.objects['video0'].resolved.instances).toHaveLength(1)

			// Before class
			const state = Resolver.getState(resolved, 10, 10)
			expect(state.layers['0']).toBeTruthy()
			expect(state.layers['0'].content).toEqual({
				val: 1,
				val2: 2,
			})

			// With class
			const state2 = Resolver.getState(resolved, 110, 10)
			expect(state2.layers['0']).toBeTruthy()
			expect(state2.layers['0'].content).toEqual({
				val: 1,
			})
		})
		test('Keyframe falsey enable2', () => {
			const timeline = fixTimeline([
				{
					id: 'video0',
					layer: '0',
					enable: {
						while: '1',
					},
					content: {
						val: 1,
					},
					keyframes: [
						{
							id: 'keyframe0',
							enable: { while: '!.class0' },
							content: {
								val2: 2,
							},
						},
					],
				},
				{
					id: 'enabler0',
					layer: '1',
					enable: {
						start: 100,
					},
					content: {},
					classes: ['class0'],
				},
			])

			const resolved = Resolver.resolveAllStates(
				Resolver.resolveTimeline(timeline, { cache: getCache(), time: 0, limitCount: 10, limitTime: 999 })
			)

			expect(resolved.statistics.resolvedObjectCount).toEqual(2)
			expect(resolved.statistics.unresolvedCount).toEqual(0)

			expect(resolved.objects['video0']).toBeTruthy()
			expect(resolved.objects['video0'].resolved.instances).toHaveLength(1)

			// Before class
			const state = Resolver.getState(resolved, 10, 10)
			expect(state.layers['0']).toBeTruthy()
			expect(state.layers['0'].content).toEqual({
				val: 1,
				val2: 2,
			})

			// With class
			const state2 = Resolver.getState(resolved, 110, 10)
			expect(state2.layers['0']).toBeTruthy()
			expect(state2.layers['0'].content).toEqual({
				val: 1,
			})
		})
		test('Keyframe truthy enable', () => {
			const timeline = fixTimeline([
				{
					id: 'video0',
					layer: '0',
					enable: {
						while: 1,
					},
					content: {
						val: 1,
					},
					keyframes: [
						{
							id: 'keyframe0',
							enable: { while: '.class0' },
							content: {
								val2: 2,
							},
						},
					],
				},
				{
					id: 'enabler0',
					layer: '1',
					enable: {
						start: 100,
					},
					content: {},
					classes: ['class0'],
				},
			])

			const resolved = Resolver.resolveAllStates(
				Resolver.resolveTimeline(timeline, { cache: getCache(), time: 0, limitCount: 10, limitTime: 999 })
			)

			expect(resolved.statistics.resolvedObjectCount).toEqual(2)
			expect(resolved.statistics.unresolvedCount).toEqual(0)

			expect(resolved.objects['video0']).toBeTruthy()
			expect(resolved.objects['video0'].resolved.instances).toHaveLength(1)

			// Before class
			const state = Resolver.getState(resolved, 10, 10)
			expect(state.layers['0']).toBeTruthy()
			expect(state.layers['0'].content).toEqual({
				val: 1,
			})

			// With class
			const state2 = Resolver.getState(resolved, 110, 10)
			expect(state2.layers['0']).toBeTruthy()
			expect(state2.layers['0'].content).toEqual({
				val: 1,
				val2: 2,
			})
		})
		test('Keyframe class from chained groups', () => {
			// https://github.com/SuperFlyTV/supertimeline/pull/56
			const timeline = fixTimeline([
				{
					id: 'object0',
					enable: {
						while: 1,
					},
					priority: 0,
					layer: 'obj0',
					content: {
						val: 1,
					},
					keyframes: [
						{
							id: 'object0_kf0',
							enable: {
								while: '.show_pip',
							},
							content: {
								val2: 2,
							},
						},
					],
				},
				{
					id: 'object1',
					enable: {
						while: '.show_pip',
					},
					priority: 0,
					layer: 'obj1',
					content: {},
				},
				{
					id: 'class0',
					priority: 0,
					enable: {
						start: 1000,
						duration: 800,
					},
					layer: 'cl0',
					classes: ['show_pip'],
					content: {},
				},
				{
					id: 'class1',
					priority: 0,
					enable: {
						start: 2000,
					},
					layer: 'cl0',
					classes: ['show_pip'],
					content: {},
				},
			])

			const resolved = Resolver.resolveAllStates(
				Resolver.resolveTimeline(timeline, { cache: getCache(), time: 800, limitCount: 10, limitTime: 3000 })
			)

			expect(resolved.statistics.unresolvedCount).toEqual(0)

			expect(resolved.objects['object0']).toBeTruthy()
			expect(resolved.objects['object0'].resolved.instances).toHaveLength(1)

			// Before class
			const state = Resolver.getState(resolved, 800, 10)
			expect(state.layers['obj0']).toBeTruthy()
			expect(state.layers['obj1']).toBeFalsy()
			expect(state.layers['obj0'].content).toEqual({
				val: 1,
			})

			// With class
			const state2 = Resolver.getState(resolved, 1600, 10)
			expect(state2.layers['obj0']).toBeTruthy()
			expect(state2.layers['obj1']).toBeTruthy()
			expect(state2.layers['obj0'].content).toEqual({
				val: 1,
				val2: 2,
			})

			// Before class from second
			const state3 = Resolver.getState(resolved, 1900, 10)
			expect(state3.layers['obj0']).toBeTruthy()
			expect(state3.layers['obj1']).toBeFalsy()
			expect(state3.layers['obj0'].content).toEqual({
				val: 1,
			})

			// With class from second
			const state4 = Resolver.getState(resolved, 2100, 10)
			expect(state4.layers['obj0']).toBeTruthy()
			expect(state4.layers['obj1']).toBeTruthy()
			expect(state4.layers['obj0'].content).toEqual({
				val: 1,
				val2: 2,
			})
		})

		test('Keyframes in resuming objects 1', () => {
			const timeline = fixTimeline([
				{
					id: 'obj0',
					enable: {
						start: 500.5,
					},
					priority: 0,
					layer: '0',
					content: {
						input: 6000,
					},
					keyframes: [],
				},
				{
					id: 'obj1',
					enable: {
						start: 1,
						end: 500,
					},
					priority: 0.1,
					layer: '0',
					content: {
						input: 6001,
					},
					keyframes: [],
				},
				{
					id: 'obj2',
					enable: {
						while: '1',
					},
					priority: 0.05,
					layer: '0',
					content: {
						input: 1000,
					},
					keyframes: [
						{
							id: 'kf0',
							enable: {
								start: '0',
								end: '2000',
							},
							disabled: false,
							content: {
								input: 9,
							},
						},
					],
				},
			])

			const resolved = Resolver.resolveAllStates(
				Resolver.resolveTimeline(timeline, { cache: getCache(), time: 0, limitCount: 10, limitTime: 999 })
			)

			expect(resolved.statistics.resolvedObjectCount).toEqual(3)
			expect(resolved.statistics.unresolvedCount).toEqual(0)

			expect(resolved.objects).toMatchObject({
				kf0: {
					resolved: {
						instances: [
							{ start: 0, end: 1 },
							{ start: 500, end: 500.5 },
							{ start: 500.5, end: 2000 },
						],
					},
				},
				obj2: {
					resolved: {
						instances: [
							{ start: 0, end: 1 },
							{ start: 500, end: 500.5 },
							{ start: 500.5, end: null },
						],
					},
				},
				obj1: {
					resolved: {
						instances: [{ start: 1, end: 500 }],
					},
				},
			})

			// Before obj1 end
			const state = Resolver.getState(resolved, 490, 10)
			expect(state.layers['0']).toBeTruthy()
			expect(state.layers['0'].content).toEqual({
				input: 6001,
			})

			// After obj1 end
			const state2 = Resolver.getState(resolved, 1000, 10)
			expect(state2.layers['0']).toBeTruthy()
			expect(state2.layers['0'].content).toEqual({
				input: 9,
			})
			// After kf0 end
			const state3 = Resolver.getState(resolved, 3000, 10)
			expect(state3.layers['0']).toBeTruthy()
			expect(state3.layers['0'].content).toEqual({
				input: 1000,
			})
		})
		test('Keyframes in resuming objects 2', () => {
			const timeline = fixTimeline([
				{
					id: 'obj0',
					enable: {
						start: 10,
						end: 100,
					},
					layer: '0',
					content: {
						input: 0,
					},
					keyframes: [
						{
							id: 'kf0',
							enable: {
								while: '1',
							},
							disabled: false,
							content: {
								input: 99,
							},
						},
					],
				},
				{
					id: 'obj1',
					enable: {
						start: 50,
						end: 60,
					},
					layer: '0',
					content: {
						input: 1,
					},
					keyframes: [],
				},
			])

			const resolved = Resolver.resolveTimeline(timeline, {
				cache: getCache(),
				time: 0,
				limitCount: 10,
				limitTime: 999,
			})

			// Note:
			// I removed these checks, since when running this test with a populated cache
			// the objects have already been properly resolved by Resolved.resolveAllStates
			// @nytamin 2021-10-22

			// expect(resolved.objects['obj0'].resolved.instances).toMatchObject([{ start: 10, end: 100 }])
			// expect(resolved.objects['obj1'].resolved.instances).toMatchObject([{ start: 50, end: 60 }])
			// expect(resolved.objects['kf0'].resolved.instances).toMatchObject([{ start: 10, end: 100 }])

			const resolvedAllStates = Resolver.resolveAllStates(resolved)

			expect(resolvedAllStates.objects['obj0'].resolved.instances).toMatchObject([
				{ start: 10, end: 50 },
				{ start: 60, end: 100 },
			])
			expect(resolvedAllStates.objects['obj1'].resolved.instances).toMatchObject([{ start: 50, end: 60 }])
			expect(resolvedAllStates.objects['kf0'].resolved.instances).toMatchObject([
				{ start: 10, end: 50 },
				{ start: 60, end: 100 },
			])
		})
		test('Keyframes in capped objects', () => {
			const timeline = fixTimeline([
				{
					id: 'grp0',
					enable: {
						start: 1000,
						end: '#grp1.start + 300',
					},
					priority: 1,
					layer: 'layer1',
					content: {
						objects: [],
					},
					children: [
						{
							id: 'grp0_0',
							content: {},
							enable: {
								start: 0,
							},
							layer: 'layer0',
							priority: 2,
							keyframes: [
								{
									id: 'grp0_0_kf0',
									enable: {
										while: '1',
									},
									content: {
										kf: 0,
									},
								},
							],
						},
					],
					isGroup: true,
				},
				{
					id: 'grp1',
					enable: {
						start: 5000,
					},
					priority: 1,
					layer: 'layer1',
					content: {
						objects: [],
					},
					children: [
						{
							id: 'grp1_0',
							content: {},
							enable: {
								start: 500,
							},
							layer: 'layer0',
							priority: 2,
						},
					],
					isGroup: true,
				},
			])

			const resolved = Resolver.resolveTimeline(timeline, {
				cache: getCache(),
				time: 0,
				limitCount: 10,
				limitTime: 999,
			})
			const states = Resolver.resolveAllStates(resolved)
			expect(states.objects['grp0'].resolved.instances).toMatchObject([{ start: 1000, end: 5000 }])
			expect(states.objects['grp1'].resolved.instances).toMatchObject([{ start: 5000, end: null }])
			expect(states.objects['grp0_0'].resolved.instances).toMatchObject([{ start: 1000, end: 5000 }]) // capped by its parent
			expect(states.objects['grp0_0_kf0'].resolved.instances).toMatchObject([{ start: 1000, end: 5000 }]) // capped by its parent

			expect(Resolver.getState(states, 4999).layers['layer0']).toMatchObject({
				id: 'grp0_0',
				content: {
					kf: 0,
				},
			})
			expect(Resolver.getState(states, 5100).layers['layer0']).toBeFalsy()
		})
	},
	{
		normal: true,
		reversed: true,
		cache: true,
	}
)
