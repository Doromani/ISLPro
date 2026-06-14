import math

def generate_fin_stl(filename):
    # Vertices of a simple trapezoidal fin
    # Root chord = 50mm, Tip chord = 25mm, Span = 40mm, Sweep = 15mm, Thickness = 3mm
    v = [
        [0.0, 0.0, 0.0],   # 0: Root Leading Edge Bottom
        [50.0, 0.0, 0.0],  # 1: Root Trailing Edge Bottom
        [50.0, 0.0, 3.0],  # 2: Root Trailing Edge Top
        [0.0, 0.0, 3.0],   # 3: Root Leading Edge Top
        [15.0, 40.0, 0.0], # 4: Tip Leading Edge Bottom
        [40.0, 40.0, 0.0], # 5: Tip Trailing Edge Bottom
        [40.0, 40.0, 3.0], # 6: Tip Trailing Edge Top
        [15.0, 40.0, 3.0]  # 7: Tip Leading Edge Top
    ]

    # Define the 12 triangular faces (using vertex indices)
    # Winding order must be counter-clockwise from the outside
    faces = [
        # Root face (y=0), normal -Y
        [0, 1, 2], [0, 2, 3],
        # Tip face (y=40), normal +Y
        [4, 7, 6], [4, 6, 5],
        # Bottom face (z=0), normal -Z
        [0, 4, 5], [0, 5, 1],
        # Top face (z=3), normal +Z
        [3, 2, 6], [3, 6, 7],
        # Leading edge, normal pointing roughly -X
        [0, 3, 7], [0, 7, 4],
        # Trailing edge, normal pointing roughly +X
        [1, 5, 6], [1, 6, 2]
    ]

    def get_normal(p1, p2, p3):
        U = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]]
        V = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]]
        Nx = U[1]*V[2] - U[2]*V[1]
        Ny = U[2]*V[0] - U[0]*V[2]
        Nz = U[0]*V[1] - U[1]*V[0]
        length = math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz)
        if length == 0: return [0,0,0]
        return [Nx/length, Ny/length, Nz/length]

    with open(filename, 'w') as f:
        f.write("solid fin\n")
        for face in faces:
            p1, p2, p3 = v[face[0]], v[face[1]], v[face[2]]
            n = get_normal(p1, p2, p3)
            f.write(f"  facet normal {n[0]:.4f} {n[1]:.4f} {n[2]:.4f}\n")
            f.write("    outer loop\n")
            f.write(f"      vertex {p1[0]:.4f} {p1[1]:.4f} {p1[2]:.4f}\n")
            f.write(f"      vertex {p2[0]:.4f} {p2[1]:.4f} {p2[2]:.4f}\n")
            f.write(f"      vertex {p3[0]:.4f} {p3[1]:.4f} {p3[2]:.4f}\n")
            f.write("    endloop\n")
            f.write("  endfacet\n")
        f.write("endsolid fin\n")

if __name__ == "__main__":
    generate_fin_stl("model_rocket_fin.stl")
    print("STL file 'model_rocket_fin.stl' successfully generated.")
