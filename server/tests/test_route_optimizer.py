"""
verify_route_optimizer.py
Unit test for the Route Optimizer graph generation and Dijkstra logic.
Tests all 5 difficulty levels (5 topologies) with 20 random weight assignments each.
"""
import sys
import random

# ── Mirror of JS topology definitions ──────────────────────────────────
TOPOLOGIES = {
    4: {
        "nodes": ["S", "A", "B", "E"],
        "edges": [("S","A"), ("S","B"), ("A","E"), ("B","E"), ("A","B")],
        "start": "S", "end": "E"
    },
    5: {
        "nodes": ["S", "A", "B", "C", "E"],
        "edges": [("S","A"), ("S","B"), ("A","C"), ("B","C"), ("C","E"), ("A","E")],
        "start": "S", "end": "E"
    },
    6: {
        "nodes": ["S", "A", "B", "C", "D", "E"],
        "edges": [("S","A"), ("S","C"), ("A","B"), ("A","D"), ("C","D"), ("B","E"), ("D","E")],
        "start": "S", "end": "E"
    },
    7: {
        "nodes": ["S", "A", "B", "C", "D", "F", "E"],
        "edges": [("S","A"), ("S","C"), ("A","B"), ("A","D"), ("B","F"),
                  ("C","D"), ("D","F"), ("F","E"), ("C","F"), ("B","E")],
        "start": "S", "end": "E"
    },
    8: {
        "nodes": ["S", "A", "B", "C", "D", "F", "G", "E"],
        "edges": [("S","A"), ("S","C"), ("A","B"), ("A","D"), ("B","F"),
                  ("C","D"), ("C","G"), ("D","G"), ("F","G"), ("F","E"), ("G","E"), ("D","F")],
        "start": "S", "end": "E"
    }
}

DDA_CONFIGS = {
    1: {"node_count": 4, "min_weight": 1, "max_weight": 9},
    2: {"node_count": 5, "min_weight": 1, "max_weight": 12},
    3: {"node_count": 6, "min_weight": 1, "max_weight": 15},
    4: {"node_count": 7, "min_weight": 2, "max_weight": 20},
    5: {"node_count": 8, "min_weight": 2, "max_weight": 25},
}


def dijkstra(nodes, adjacency, start_id):
    dist = {n: float('inf') for n in nodes}
    prev = {n: None for n in nodes}
    unvisited = set(nodes)
    dist[start_id] = 0

    while unvisited:
        u = min(unvisited, key=lambda x: dist[x])
        if dist[u] == float('inf'):
            break
        unvisited.remove(u)
        for (to_id, weight) in adjacency.get(u, []):
            alt = dist[u] + weight
            if alt < dist[to_id]:
                dist[to_id] = alt
                prev[to_id] = u

    return dist, prev


def reconstruct_path(prev, start_id, end_id):
    path = []
    cur = end_id
    while cur is not None:
        path.insert(0, cur)
        cur = prev[cur]
    return path if path[0] == start_id else []


def generate_graph(node_count, min_w, max_w, rand):
    topo = TOPOLOGIES[node_count]
    nodes = topo["nodes"]
    edges = topo["edges"]
    start = topo["start"]
    end   = topo["end"]

    # Assign random weights
    weighted_edges = [(a, b, rand.randint(min_w, max_w)) for a, b in edges]

    # Build bidirectional adjacency list
    adjacency = {n: [] for n in nodes}
    for (a, b, w) in weighted_edges:
        adjacency[a].append((b, w))
        adjacency[b].append((a, w))

    dist, prev = dijkstra(nodes, adjacency, start)
    optimal_cost = dist[end]
    optimal_path = reconstruct_path(prev, start, end)

    return {
        "nodes": nodes,
        "weighted_edges": weighted_edges,
        "adjacency": adjacency,
        "optimal_cost": optimal_cost,
        "optimal_path": optimal_path,
        "start": start,
        "end": end,
        "min_w": min_w,
        "max_w": max_w
    }


def run_tests():
    print("=" * 65)
    print("  ROUTE OPTIMIZER -- Graph Generation & Dijkstra Verification")
    print("=" * 65)

    rand = random.Random(42)
    total = 0
    passed = 0
    failed = 0

    for level, cfg in DDA_CONFIGS.items():
        nc = cfg["node_count"]
        min_w = cfg["min_weight"]
        max_w = cfg["max_weight"]
        print(f"\n[Level {level}] nodes={nc}, weights=[{min_w},{max_w}]")

        for trial in range(20):
            total += 1
            g = generate_graph(nc, min_w, max_w, rand)
            errors = []

            # 1. Optimal path must exist and connect S to E
            if not g["optimal_path"]:
                errors.append("No path found from S to E")
            elif g["optimal_path"][0] != "S" or g["optimal_path"][-1] != "E":
                errors.append(f"Path endpoints wrong: {g['optimal_path']}")

            # 2. Optimal cost must be finite and positive
            if not (0 < g["optimal_cost"] < float('inf')):
                errors.append(f"Invalid optimal_cost: {g['optimal_cost']}")

            # 3. Verify each edge in optimal path actually exists in the graph
            adj = g["adjacency"]
            path = g["optimal_path"]
            computed_cost = 0
            for i in range(len(path) - 1):
                a, b = path[i], path[i + 1]
                matching = [w for (to, w) in adj.get(a, []) if to == b]
                if not matching:
                    errors.append(f"Edge {a}->{b} in optimal path does not exist in graph")
                else:
                    computed_cost += matching[0]

            if computed_cost != g["optimal_cost"] and not errors:
                errors.append(f"Computed path cost {computed_cost} != optimal_cost {g['optimal_cost']}")

            # 4. All weights within [min_w, max_w]
            for (a, b, w) in g["weighted_edges"]:
                if not (min_w <= w <= max_w):
                    errors.append(f"Edge {a}-{b} weight {w} out of range [{min_w},{max_w}]")

            # 5. Path length must be at least 2 nodes
            if len(path) < 2 and not errors:
                errors.append(f"Path too short: {path}")

            if errors:
                failed += 1
                print(f"  FAIL Trial {trial+1:02d}: {'; '.join(errors)}")
            else:
                passed += 1
                if trial < 3:
                    path_str = " -> ".join(g["optimal_path"])
                    print(f"  OK   [{nc} nodes] Optimal: {path_str} | Cost: {g['optimal_cost']}")

    print("\n" + "=" * 65)
    print(f"  Results: {passed}/{total} passed  |  {failed} failed")
    print("=" * 65)

    if failed == 0:
        print("  ALL TESTS PASSED - Route Optimizer ready for integration!")
        return 0
    else:
        print("  SOME TESTS FAILED - Review graph generation logic.")
        return 1


if __name__ == '__main__':
    sys.exit(run_tests())
